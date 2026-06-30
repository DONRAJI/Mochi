/** 스켈레톤용 mock 데이터 (실데이터는 fridge 서비스 연동 시 교체). */
export type MockRarity = "common" | "rare" | "epic" | "seasonal";

export interface MockIngredient {
  id: number;
  emoji: string;
  name: string;
  category: string;
  rarity?: MockRarity;
}

export const FRIDGE_CATEGORIES = ["전체", "채소", "단백질", "유제품", "곡물"] as const;

export const MOCK_INGREDIENTS: MockIngredient[] = [
  { id: 1, emoji: "🥚", name: "계란", category: "단백질" },
  { id: 2, emoji: "🧅", name: "양파", category: "채소" },
  { id: 3, emoji: "🧀", name: "치즈", category: "유제품", rarity: "rare" },
  { id: 4, emoji: "🥦", name: "브로콜리", category: "채소" },
  { id: 5, emoji: "🍗", name: "닭가슴살", category: "단백질" },
  { id: 6, emoji: "🥛", name: "우유", category: "유제품" },
  { id: 7, emoji: "🍚", name: "쌀", category: "곡물" },
  { id: 8, emoji: "🦐", name: "새우", category: "단백질", rarity: "epic" },
  { id: 9, emoji: "🥕", name: "당근", category: "채소" },
];

export const MOCK_EXPIRING = [
  { emoji: "🧈", name: "두부", days: 1 },
  { emoji: "🥬", name: "상추", days: 2 },
  { emoji: "🍅", name: "토마토", days: 3 },
];
