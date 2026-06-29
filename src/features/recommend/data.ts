/** 스켈레톤용 mock (추천 엔진 연동 시 교체). */
export type MealMode = "cook" | "eatout" | "convenience";

export const MEAL_MODES = [
  { value: "cook", label: "요리" },
  { value: "eatout", label: "외식/배달" },
  { value: "convenience", label: "간편식" },
] as const;

export const SORT_FILTERS = ["15분 이내", "추가구매 없음", "단백질 위주", "가벼움"] as const;

export interface MockRecipe {
  id: number;
  emoji: string;
  name: string;
  minutes: number;
  servings: number;
  match: number; // 가진 재료(또는 취향) 매칭률 %
  badge: string; // 랭킹 뱃지 (💪단백질 / 🫧포만감 / 🍃가벼움)
  buy: string[]; // 추가구매 재료
  steps: string[];
}

/** 비요리 사용자도 동일 루프 — 모드별 추천을 모두 채운다 (불변 #5, PRD 8장). */
export const MOCK_RECIPES: Record<MealMode, MockRecipe[]> = {
  cook: [
    {
      id: 1,
      emoji: "🍳",
      name: "김치두부조림",
      minutes: 15,
      servings: 1,
      match: 90,
      badge: "💪 단백질",
      buy: [],
      steps: ["두부를 도톰하게 썰어요", "김치와 함께 자작하게 끓여요", "참기름 한 방울로 마무리"],
    },
    {
      id: 2,
      emoji: "🥗",
      name: "닭가슴살 샐러드",
      minutes: 10,
      servings: 1,
      match: 70,
      badge: "🍃 가벼움",
      buy: ["방울토마토"],
      steps: ["채소를 한 입 크기로", "닭가슴살을 올려요", "드레싱을 살짝"],
    },
  ],
  eatout: [
    {
      id: 3,
      emoji: "🍲",
      name: "순두부찌개 한 상",
      minutes: 0,
      servings: 1,
      match: 85,
      badge: "🫧 포만감",
      buy: [],
      steps: ["주변 매장을 볼까요?", "배달앱으로 바로 연결돼요"],
    },
    {
      id: 4,
      emoji: "🍜",
      name: "쌀국수",
      minutes: 0,
      servings: 1,
      match: 75,
      badge: "🍃 가벼움",
      buy: [],
      steps: ["가까운 가게부터 보여드릴게요"],
    },
  ],
  convenience: [
    {
      id: 5,
      emoji: "🥪",
      name: "닭가슴살+그릭요거트+바나나",
      minutes: 0,
      servings: 1,
      match: 80,
      badge: "💪 단백질",
      buy: ["그릭요거트"],
      steps: ["편의점에서 세 가지만", "균형 한 끼 완성"],
    },
    {
      id: 6,
      emoji: "🍱",
      name: "단백질 도시락",
      minutes: 0,
      servings: 1,
      match: 65,
      badge: "🫧 포만감",
      buy: [],
      steps: ["바코드 찍으면 도감에 쏙"],
    },
  ],
};
