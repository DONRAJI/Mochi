/**
 * 다이어트 관점 재료 힌트 — "냉장고 재료로 가볍게" 컨셉을 레시피 재료에 입힌다.
 * 순수 데이터/함수라 마이그레이션 없이 전 레시피(1150개)에 즉시 적용된다.
 *
 * 죄책감 제로(불변 #1): "이건 살쪄요"가 아니라 "이렇게 바꾸면 더 가벼워요" 톤.
 * 강요가 아니라 제안 — 원래 레시피는 그대로 두고, 옆에 부드러운 대안을 귀띔한다.
 */

export interface IngredientSwap {
  to: string; // 가벼운 대체 재료
  note: string; // 모찌 보이스 한마디 (부드럽게)
}

export interface IngredientHint {
  optional: boolean; // 없어도 요리가 성립하는 고명·선택 재료
  swap: IngredientSwap | null; // 고열량 → 가벼운 대체 제안
}

/** 없어도 괜찮은 고명·선택 재료 (빼면 더 가볍고, 요리는 그대로 성립). */
const OPTIONAL = new Set([
  "통깨",
  "참깨",
  "깨",
  "깨소금",
  "실고추",
  "파슬리",
  "파슬리가루",
  "후추",
  "후춧가루",
  "고명",
  "쪽파",
  "견과류",
  "땅콩",
  "잣",
  "슬라이스치즈",
  "체다치즈",
]);

/**
 * 대분류별 가벼운 대체 (#1) — 같은 고열량 분류의 재료는 대표 대체로 묶어 커버리지를 넓힌다.
 * (개별 재료를 일일이 넣는 대신 "고기류·면류·당류·유지류…"로 분류) 키는 레시피 재료명(파싱 원문).
 */
const SWAP_GROUPS: { members: string[]; to: string; note: string }[] = [
  {
    // 고기류(고열량 부위)
    members: [
      "삼겹살", "베이컨", "목살", "차돌박이", "우삼겹", "항정살", "갈비", "돼지갈비",
      "LA갈비", "곱창", "막창", "대창", "가브리살", "오겹살",
    ],
    to: "닭가슴살",
    note: "닭가슴살이면 단백질은 그대로, 더 가벼워요",
  },
  {
    // 면류
    members: [
      "라면사리", "소면", "당면", "우동면", "칼국수면", "칼국수", "파스타", "스파게티",
      "쫄면", "중화면", "짜장면", "라면",
    ],
    to: "곤약면",
    note: "곤약면으로 바꾸면 훨씬 가벼워요",
  },
  {
    // 당류
    members: ["설탕", "백설탕", "황설탕", "흑설탕", "물엿", "올리고당", "꿀", "조청", "시럽"],
    to: "알룰로스",
    note: "알룰로스로도 충분히 달콤해요",
  },
  {
    // 마요·고열량 소스
    members: ["마요네즈", "마요", "케찹마요", "와사비마요", "타르타르소스"],
    to: "그릭요거트",
    note: "그릭요거트로 바꾸면 더 가벼워요",
  },
  {
    // 유지류
    members: ["버터", "마가린", "쇼트닝", "라드"],
    to: "올리브유",
    note: "올리브유 살짝이면 충분해요",
  },
  {
    // 크림류
    members: ["생크림", "휘핑크림", "휘핑"],
    to: "우유",
    note: "우유로도 부드러워요",
  },
  {
    // 흰쌀·정제 탄수
    members: ["흰쌀밥", "백미", "쌀", "밥", "흰밥"],
    to: "현미밥",
    note: "현미밥이면 포만감이 오래가요",
  },
];

/** 재료명이 속한 대체 그룹(첫 매칭). */
function swapFor(name: string): IngredientSwap | null {
  const group = SWAP_GROUPS.find((g) => g.members.includes(name));
  return group ? { to: group.to, note: group.note } : null;
}

/** 재료명 하나에 대한 다이어트 힌트. (recommend 서비스에서 재료마다 호출) */
export function ingredientHint(name: string): IngredientHint {
  return {
    optional: OPTIONAL.has(name),
    swap: swapFor(name),
  };
}

/** 이 레시피에 가벼운 제안이 하나라도 있는지 (카드에 "가볍게 바꾸기" 뱃지 노출용). */
export function hasLighterOption(names: string[]): boolean {
  return names.some((n) => OPTIONAL.has(n) || swapFor(n) !== null);
}
