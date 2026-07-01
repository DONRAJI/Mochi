import "server-only";
import { db } from "@/server/db";
import { computeMatchRate, missingIngredients } from "@/features/recommend/ranking";
import { deriveBadge } from "@/features/recommend/nutrition";
import { ingredientHint } from "@/features/recommend/substitution";
import { buildCanonicalMap, canonicalize } from "@/features/fridge/canonical";
import type { MealMode, RecommendationResponse } from "@/features/recommend/types";

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

  if (mode === "cook") {
    const [recipes, fridge, masters] = await Promise.all([
      db.recipe.findMany(),
      userId
        ? db.ingredient.findMany({ where: { userId }, select: { name: true } })
        : Promise.resolve([] as { name: string }[]),
      db.ingredientMaster.findMany({ select: { name: true, aliases: true } }),
    ]);
    const canon = buildCanonicalMap(masters);
    const owned = fridge.map((f) => canonicalize(f.name, canon));
    const ownedSet = new Set(owned);

    return recipes
      .map((r) => {
        const required = r.ingredients.map((i) => canonicalize(i, canon));
        const seen = new Set<string>();
        return {
          id: r.id,
          name: r.name,
          emoji: r.emoji,
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
              const hint = ingredientHint(raw);
              return { name, owned: ownedSet.has(name), optional: hint.optional, swap: hint.swap };
            }),
          subtitle: null,
          rarity: r.rarity,
          steps: r.steps,
        };
      })
      .sort((a, b) => b.matchRate - a.matchRate || a.minutes - b.minutes)
      .slice(skip, skip + size);
  }

  if (mode === "eatout") {
    const menus = await db.menu.findMany({ skip, take: size });
    return menus.map((m) => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      badge: deriveBadge(m.kcal, m.protein),
      minutes: null,
      servings: null,
      matchRate: null,
      missingIngredients: [],
      ingredients: [],
      subtitle: m.category,
      rarity: m.rarity,
      steps: [],
    }));
  }

  const items = await db.convenienceItem.findMany({ skip, take: size });
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    badge: deriveBadge(c.kcal, c.protein),
    minutes: null,
    servings: null,
    matchRate: null,
    missingIngredients: [],
    ingredients: [],
    subtitle: c.brand,
    rarity: c.rarity,
    steps: [],
  }));
}
