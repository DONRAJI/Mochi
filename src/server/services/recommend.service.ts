import "server-only";
import { db } from "@/server/db";
import { computeMatchRate, missingIngredients } from "@/features/recommend/ranking";
import type { MealMode, RecommendationResponse } from "@/features/recommend/types";

/**
 * recommend 서비스 — 시드 카탈로그(Recipe/Menu/ConvenienceItem)를 3모드로 서빙.
 * 요리 모드는 유저 냉장고(Ingredient) 기준 매칭률을 실제 계산해 내림차순 정렬.
 * (비요리 동등 — 불변 #5: 외식/간편식도 동일하게 카탈로그에서 서빙.)
 */
export async function getRecommendations(
  mode: MealMode,
  userId: string | null,
  page: number,
  size: number,
): Promise<RecommendationResponse[]> {
  const skip = page * size;

  if (mode === "cook") {
    const [recipes, fridge] = await Promise.all([
      db.recipe.findMany(),
      userId
        ? db.ingredient.findMany({ where: { userId }, select: { name: true } })
        : Promise.resolve([] as { name: string }[]),
    ]);
    const owned = fridge.map((f) => f.name);

    return recipes
      .map((r) => ({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        badge: r.badge,
        minutes: r.minutes,
        servings: r.servings,
        matchRate: computeMatchRate(owned, r.ingredients),
        missingIngredients: missingIngredients(owned, r.ingredients),
        subtitle: null,
        rarity: r.rarity,
        steps: r.steps,
      }))
      .sort((a, b) => b.matchRate - a.matchRate || a.minutes - b.minutes)
      .slice(skip, skip + size);
  }

  if (mode === "eatout") {
    const menus = await db.menu.findMany({ skip, take: size });
    return menus.map((m) => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      badge: m.badge,
      minutes: null,
      servings: null,
      matchRate: null,
      missingIngredients: [],
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
    badge: c.badge,
    minutes: null,
    servings: null,
    matchRate: null,
    missingIngredients: [],
    subtitle: c.brand,
    rarity: c.rarity,
    steps: [],
  }));
}
