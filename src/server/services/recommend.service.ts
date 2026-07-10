import "server-only";
import { db } from "@/server/db";
import { computeMatchRate, missingIngredients } from "@/features/recommend/ranking";
import { deriveBadge } from "@/features/recommend/nutrition";
import { swapFor } from "@/features/recommend/substitution";
import { isPractical, isSkippableRare } from "@/features/recommend/practicality";
import { MGR_ID_PREFIX } from "@/features/recommend/mgrParse";
import { estimateMinutes } from "@/features/recommend/recipeParse";
import {
  soloFriendlyScore,
  commonIngredientRatio,
  buildIngredientFrequency,
} from "@/features/recommend/soloFriendly";
import {
  groupPreferences,
  hasAllergen,
  preferenceScore,
  ingredientMatcher,
  nameMatcher,
} from "@/features/recommend/preferences";
import { buildCanonicalMap, canonicalize } from "@/features/fridge/canonical";
import { isExpiringSoon, expiryBonus } from "@/features/fridge/expiry";
import type {
  CreateRecipeRequest,
  MealMode,
  RecommendationResponse,
} from "@/features/recommend/types";

/**
 * recommend 서비스 — 시드 카탈로그를 3모드로 서빙.
 * 요리 모드: 재료 마스터로 이름 정규화(별칭→표준명) 후 냉장고 매칭률 계산.
 * 뱃지는 영양(kcal/protein)에서 자동 산출(deriveBadge) — 영양 숫자는 응답에 안 넣는다(불변 #2).
 */
export async function getRecommendations(
  mode: MealMode,
  userId: string | null,
  page: number,
  size: number,
): Promise<RecommendationResponse[]> {
  const skip = page * size;

  // 취향 + 표시 모드 + 즐겨찾기 — 로그인 시에만. detail이면 kcal 포함(#4), 즐겨찾기 플래그(#7).
  const [prefTags, user, favRows] = userId
    ? await Promise.all([
        db.preferenceTag.findMany({ where: { userId }, select: { kind: true, label: true } }),
        db.user.findUnique({ where: { id: userId }, select: { displayMode: true } }),
        db.favorite.findMany({ where: { userId }, select: { refId: true } }),
      ])
    : [[] as { kind: string; label: string }[], null, [] as { refId: string }[]];
  const prefs = groupPreferences(prefTags);
  const detail = user?.displayMode === "detail";
  const favoriteSet = new Set(favRows.map((f) => f.refId));

  if (mode === "cook") {
    // 시드 카탈로그(ownerId=null) + 내 요리(ownerId=userId)만. 남의 요리는 노출 안 함.
    const [recipes, fridge, masters] = await Promise.all([
      db.recipe.findMany({
        where: { OR: [{ ownerId: null }, ...(userId ? [{ ownerId: userId }] : [])] },
      }),
      userId
        ? db.ingredient.findMany({ where: { userId }, select: { name: true, expiresAt: true } })
        : Promise.resolve([] as { name: string; expiresAt: Date | null }[]),
      db.ingredientMaster.findMany({ select: { name: true, aliases: true } }),
    ]);
    const now = new Date();
    const canon = buildCanonicalMap(masters);
    // 카탈로그 전체로 재료 등장 빈도 집계 → '흔한 재료'로 만든 요리를 자취 점수에 반영(추가 쿼리 0).
    const ingFreq = buildIngredientFrequency(recipes, (name) => canonicalize(name, canon));
    const owned = fridge.map((f) => canonicalize(f.name, canon));
    const ownedSet = new Set(owned);
    // 유통기한 임박(3일 이내·지난 것 포함) 재료 — 먼저 쓰도록 추천 가산점 (PRD 5.2).
    const expiringSet = new Set(
      fridge.filter((f) => isExpiringSoon(f.expiresAt, now)).map((f) => canonicalize(f.name, canon)),
    );
    // 취향 라벨도 표준명으로 정규화(토마토→방울토마토)해 재료와 정확일치시킨다.
    const canonLabels = (arr: string[]) => arr.map((l) => canonicalize(l, canon));
    const allergiesC = canonLabels(prefs.allergies);
    const likesC = canonLabels(prefs.likes);
    const dislikesC = canonLabels(prefs.dislikes);

    // 히든 콤보(PRD 7.3#3): 조합을 다 가진 것만 노출, 나머지 히든은 숨김.
    const visibleRecipes = recipes.filter(
      (r) =>
        r.hiddenCombo.length === 0 ||
        r.hiddenCombo.every((i) => ownedSet.has(canonicalize(i, canon))),
    );

    // 실용성 하드 컷 — 초희귀 재료·재료 과다 '정식 요리'는 추천에서 제외(식약처 코퍼스 대상).
    // 빈도는 전체 코퍼스로 집계(ingFreq). 예외: 내 요리(ownerId) + 만개의레시피(mgr-)는
    // 조회수 10만+ 대중 검증분이라 항상 노출(파싱 노이즈로 국민 레시피가 컷되는 오판 방지).
    const practicalRecipes = visibleRecipes.filter(
      (r) =>
        r.ownerId != null ||
        r.id.startsWith(MGR_ID_PREFIX) ||
        isPractical([...new Set(r.ingredients.map((i) => canonicalize(i, canon)))], ingFreq),
    );

    const cards = practicalRecipes
      .map((r) => {
        const required = r.ingredients.map((i) => canonicalize(i, canon));
        const seen = new Set<string>();
        return {
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          imageUrl: r.imageUrl,
          kcal: detail ? r.kcal : null,
          badge: deriveBadge(r.kcal, r.protein),
          minutes: r.minutes,
          servings: r.servings,
          matchRate: computeMatchRate(owned, required),
          missingIngredients: missingIngredients(owned, required),
          // 재료 + 다이어트 힌트(대체·선택). 원 재료명 기준으로 힌트, 표시명은 정규화.
          ingredients: r.ingredients
            .filter((raw) => {
              const c = canonicalize(raw, canon);
              if (seen.has(c)) return false;
              seen.add(c);
              return true;
            })
            .map((raw) => {
              const name = canonicalize(raw, canon);
              const isOwned = ownedSet.has(name);
              return {
                name,
                owned: isOwned,
                // '없어도 괜찮아요'는 미보유 + 코퍼스 희귀 재료만 — 흔한 양념(후추·깨)엔 침묵.
                // 요리 이름의 주인공 재료도 제외 (practicality.isSkippableRare).
                optional: !isOwned && isSkippableRare(name, ingFreq, r.name),
                swap: swapFor(raw),
              };
            }),
          mine: r.ownerId != null,
          usesExpiring: required.some((n) => expiringSet.has(n)),
          favorited: favoriteSet.has(r.id),
          hidden: r.hiddenCombo.length > 0,
          subtitle: null,
          rarity: r.rarity,
          steps: r.steps,
        };
      })
      // 알러지 재료가 든 요리는 제외(안전). 정렬은 매칭률 + 취향 + 임박 보정.
      .filter((c) => !hasAllergen(ingredientMatcher(c.ingredients.map((i) => i.name)), allergiesC));

    return cards
      .map((c) => ({
        c,
        key:
          c.matchRate +
          preferenceScore(ingredientMatcher(c.ingredients.map((i) => i.name)), likesC, dislikesC) +
          expiryBonus(c.ingredients.map((i) => i.name), expiringSet) +
          // 자취생이 혼자 할 만한 현실적인 요리를 위로 — 쉬움(재료·단계·시간) + 흔한 재료 비율.
          soloFriendlyScore({
            ingredientCount: c.ingredients.length,
            stepCount: c.steps.length,
            minutes: c.minutes,
            commonRatio: commonIngredientRatio(
              c.ingredients.map((i) => i.name),
              ingFreq,
              recipes.length,
            ),
          }),
      }))
      .sort((a, b) => b.key - a.key || a.c.minutes - b.c.minutes)
      .slice(skip, skip + size)
      .map((s) => s.c);
  }

  if (mode === "eatout") {
    // 작은 카탈로그 → 인메모리 필터/정렬(취향). 이름 부분일치 best-effort.
    const menus = await db.menu.findMany();
    return menus
      .filter((m) => !hasAllergen(nameMatcher(m.name), prefs.allergies))
      .map((m) => ({
        id: m.id,
        name: m.name,
        emoji: m.emoji,
        imageUrl: null,
        kcal: detail ? m.kcal : null,
        badge: deriveBadge(m.kcal, m.protein),
        minutes: null,
        servings: null,
        matchRate: null,
        missingIngredients: [],
        ingredients: [],
        mine: false,
        usesExpiring: false,
        favorited: favoriteSet.has(m.id),
        hidden: false,
        subtitle: m.category,
        rarity: m.rarity,
        steps: [],
      }))
      .sort(
        (a, b) =>
          preferenceScore(nameMatcher(b.name), prefs.likes, prefs.dislikes) -
          preferenceScore(nameMatcher(a.name), prefs.likes, prefs.dislikes),
      )
      .slice(skip, skip + size);
  }

  const items = await db.convenienceItem.findMany();
  return items
    .filter((c) => !hasAllergen(nameMatcher(c.name), prefs.allergies))
    .map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      imageUrl: null,
      kcal: detail ? c.kcal : null,
      badge: deriveBadge(c.kcal, c.protein),
      minutes: null,
      servings: null,
      matchRate: null,
      missingIngredients: [],
      ingredients: [],
      mine: false,
      usesExpiring: false,
      favorited: favoriteSet.has(c.id),
      hidden: false,
      subtitle: c.brand,
      rarity: c.rarity,
      steps: [],
    }))
    .sort(
      (a, b) =>
        preferenceScore(nameMatcher(b.name), prefs.likes, prefs.dislikes) -
        preferenceScore(nameMatcher(a.name), prefs.likes, prefs.dislikes),
    )
    .slice(skip, skip + size);
}

/** 내 요리 등록 (PRD 11.3). ownerId=userId로 저장 → 요리 모드 추천에 내 요리도 뜬다. */
export async function createUserRecipe(
  userId: string,
  input: CreateRecipeRequest,
): Promise<{ id: string }> {
  const recipe = await db.recipe.create({
    data: {
      ownerId: userId,
      name: input.name,
      emoji: "🍳",
      minutes: input.minutes ?? estimateMinutes(input.steps.length),
      ingredients: input.ingredients,
      steps: input.steps,
      kcal: input.kcal ?? null, // 선택 입력 — detail 모드 표시·예산·넛지에 반영(1인분)
    },
  });
  return { id: recipe.id };
}
