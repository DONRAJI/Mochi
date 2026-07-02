/** 자주 쓰는 재료 팔레트 (수동 스티커 입력 + 표시용 이모지 매핑). 이름은 recipe 시드 재료와 맞춤. */
export interface IngredientPreset {
  emoji: string;
  name: string;
  category: string;
}

export const COMMON_INGREDIENTS: IngredientPreset[] = [
  // 단백질
  { emoji: "🥚", name: "계란", category: "단백질" },
  { emoji: "🧈", name: "두부", category: "단백질" },
  { emoji: "🍗", name: "닭가슴살", category: "단백질" },
  { emoji: "🦐", name: "새우", category: "단백질" },
  { emoji: "🥓", name: "돼지고기", category: "단백질" },
  { emoji: "🥩", name: "소고기", category: "단백질" },
  { emoji: "🐟", name: "참치", category: "단백질" },
  { emoji: "🍣", name: "연어", category: "단백질" },
  { emoji: "🦑", name: "오징어", category: "단백질" },
  { emoji: "🫘", name: "콩", category: "단백질" },
  // 채소
  { emoji: "🧅", name: "양파", category: "채소" },
  { emoji: "🥕", name: "당근", category: "채소" },
  { emoji: "🥬", name: "상추", category: "채소" },
  { emoji: "🥦", name: "브로콜리", category: "채소" },
  { emoji: "🍅", name: "방울토마토", category: "채소" },
  { emoji: "🌶️", name: "김치", category: "채소" },
  { emoji: "🌿", name: "대파", category: "채소" },
  { emoji: "🥔", name: "감자", category: "채소" },
  { emoji: "🍠", name: "고구마", category: "채소" },
  { emoji: "🧄", name: "마늘", category: "채소" },
  { emoji: "🥒", name: "오이", category: "채소" },
  { emoji: "🫑", name: "파프리카", category: "채소" },
  { emoji: "🍄", name: "버섯", category: "채소" },
  { emoji: "🌽", name: "옥수수", category: "채소" },
  { emoji: "🍆", name: "가지", category: "채소" },
  { emoji: "🥑", name: "아보카도", category: "채소" },
  // 유제품
  { emoji: "🧀", name: "치즈", category: "유제품" },
  { emoji: "🥛", name: "우유", category: "유제품" },
  { emoji: "🧈", name: "버터", category: "유제품" },
  { emoji: "🍦", name: "요거트", category: "유제품" },
  // 곡물
  { emoji: "🍚", name: "쌀", category: "곡물" },
  { emoji: "🌾", name: "현미", category: "곡물" },
  { emoji: "🍞", name: "빵", category: "곡물" },
  { emoji: "🥣", name: "오트밀", category: "곡물" },
  // 과일
  { emoji: "🍌", name: "바나나", category: "과일" },
  { emoji: "🍎", name: "사과", category: "과일" },
  { emoji: "🍓", name: "딸기", category: "과일" },
  { emoji: "🫐", name: "블루베리", category: "과일" },
  { emoji: "🍇", name: "포도", category: "과일" },
  { emoji: "🍋", name: "레몬", category: "과일" },
];

const EMOJI_BY_NAME = new Map(COMMON_INGREDIENTS.map((i) => [i.name, i.emoji]));

/** 재료 이름 → 이모지. 모르는 재료는 기본 스티커. */
export function emojiForIngredient(name: string): string {
  return EMOJI_BY_NAME.get(name) ?? "🥗";
}
