/**
 * 모찌 뽑기 경제·확률 (순수 함수, PRD 12) — DB 무관이라 테스트 용이.
 * 죄책감 제로: 결제 없음(씨앗은 건강 행동으로만), 중복은 환급, 부드러운 보장으로 좌절 방지.
 */

export type CardRarity = "common" | "rare" | "epic" | "legendary";

/** 뽑기 1회 비용(씨앗). */
export const DRAW_COST = 5;
/** 중복 카드 나올 때 되돌려주는 씨앗(중복=진행). */
export const DUPE_REFUND = 2;
/** 이 횟수째엔 epic↑ 보장 (직전 epic↑ 이후 9번 허탕 → 10번째 보장). */
export const PITY_THRESHOLD = 10;
/** 하루 씨앗 획득 상한 — 등록/취소 반복 farming 방지(약 2회 뽑기치). */
export const DAILY_SEED_CAP = 10;

/** 오늘 이미 usedToday만큼 받았을 때, want 중 실제로 줄 수 있는 씨앗(상한 초과분은 잘림). */
export function cappedSeedGrant(want: number, usedToday: number, cap = DAILY_SEED_CAP): number {
  return Math.max(0, Math.min(want, cap - usedToday));
}

/** 등급 가중치(%) — 합 100. */
const WEIGHTS: [CardRarity, number][] = [
  ["common", 50],
  ["rare", 30],
  ["epic", 15],
  ["legendary", 5],
];

/**
 * 먹기/기록으로 얻는 씨앗 수 (PRD 12.2).
 * base +1은 **그날 그 끼니 슬롯 '처음' 기록일 때만** — 지웠다 재등록 반복으로는 안 나온다(farming 차단).
 * 첫 발견 +1, 스트릭 이어감 +1, 7·14·30일 마일스톤 +3 (이들은 본래 1회성이라 재등록에 안 나옴).
 */
export function mealSeeds(o: {
  firstMealForSlot: boolean;
  firstDiscovery: boolean;
  streakAdvanced: boolean;
  streakCount: number;
}): number {
  let s = o.firstMealForSlot ? 1 : 0;
  if (o.firstDiscovery) s += 1;
  if (o.streakAdvanced) {
    s += 1;
    if (o.streakCount === 7 || o.streakCount === 14 || o.streakCount === 30) s += 3;
  }
  return s;
}

/** 직전 epic↑ 이후 허탕 횟수가 임계 이상이면 이번 뽑기는 보장. */
export function isPityReady(pity: number): boolean {
  return pity >= PITY_THRESHOLD - 1;
}

/**
 * 등급 뽑기. rand∈[0,1). 보장 상태면 epic(3):legendary(1)로만.
 * 아니면 가중 확률(common50/rare30/epic15/legendary5).
 */
export function rollRarity(rand: number, pityReady: boolean): CardRarity {
  if (pityReady) return rand < 0.75 ? "epic" : "legendary";
  // 정수 누적(0~100)으로 비교 — 부동소수점 경계 오차 회피.
  const r = rand * 100;
  let acc = 0;
  for (const [rarity, w] of WEIGHTS) {
    acc += w;
    if (r < acc) return rarity;
  }
  return "legendary";
}

/** epic↑면 보장 카운터 리셋, 아니면 +1. */
export function nextPity(pity: number, rarity: CardRarity): number {
  return rarity === "epic" || rarity === "legendary" ? 0 : pity + 1;
}

/** 등급 내 카드 랜덤 인덱스. rand∈[0,1). */
export function pickIndex(len: number, rand: number): number {
  return Math.min(len - 1, Math.floor(rand * len));
}
