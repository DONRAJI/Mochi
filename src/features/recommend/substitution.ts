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

/** 고열량 재료 → 가벼운 대체 (부드러운 카피). 키는 레시피 재료명(파싱 원문 기준). */
const SWAPS: Record<string, IngredientSwap> = {
  마요네즈: { to: "그릭요거트", note: "그릭요거트로 바꾸면 더 가벼워요" },
  설탕: { to: "알룰로스", note: "알룰로스로도 충분히 달콤해요" },
  백설탕: { to: "알룰로스", note: "알룰로스로도 충분히 달콤해요" },
  물엿: { to: "알룰로스", note: "알룰로스로 바꿔도 좋아요" },
  올리고당: { to: "알룰로스", note: "알룰로스로 바꿔도 좋아요" },
  삼겹살: { to: "닭가슴살", note: "닭가슴살이면 단백질은 그대로예요" },
  베이컨: { to: "닭가슴살", note: "닭가슴살로 바꿔도 든든해요" },
  생크림: { to: "우유", note: "우유로도 부드러워요" },
  버터: { to: "올리브유", note: "올리브유 살짝이면 충분해요" },
  마가린: { to: "올리브유", note: "올리브유로 바꿔도 좋아요" },
  쌀: { to: "현미", note: "현미로 바꾸면 든든함이 오래가요" },
  밥: { to: "현미밥", note: "현미밥이면 포만감이 오래가요" },
  흰쌀밥: { to: "현미밥", note: "현미밥이면 포만감이 오래가요" },
  라면사리: { to: "곤약면", note: "곤약면으로 바꾸면 훨씬 가벼워요" },
  소면: { to: "곤약면", note: "곤약면으로 바꾸면 가벼워요" },
  당면: { to: "곤약면", note: "곤약면으로 바꿔도 쫄깃해요" },
};

/** 재료명 하나에 대한 다이어트 힌트. (recommend 서비스에서 재료마다 호출) */
export function ingredientHint(name: string): IngredientHint {
  return {
    optional: OPTIONAL.has(name),
    swap: SWAPS[name] ?? null,
  };
}

/** 이 레시피에 가벼운 제안이 하나라도 있는지 (카드에 "가볍게 바꾸기" 뱃지 노출용). */
export function hasLighterOption(names: string[]): boolean {
  return names.some((n) => OPTIONAL.has(n) || n in SWAPS);
}
