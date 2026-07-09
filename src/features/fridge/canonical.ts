/**
 * 재료명 정규화 — 별칭(토마토)을 표준명(방울토마토)으로 매핑해 매칭 정확도를 높인다.
 * 재료 마스터(IngredientMaster)에서 맵을 만들어 recommend 매칭·희귀도 통계에서 공용으로 쓴다.
 *
 * 강화(코퍼스 노이즈 청소): 공백 제거("닭 가슴살"→"닭가슴살") + 손질 수식어 접두 제거
 * ("다진 마늘"→"마늘"). 냉장고의 "마늘"이 레시피의 "다진 마늘"과 매칭되고,
 * 재료 빈도 통계(soloFriendly·실용성 필터)의 꼬리 노이즈가 줄어든다(1984→1802종).
 */

/** 손질 수식어 — 접두로 붙으면 떼고 본 재료로. 뗀 뒤 2글자 이상 남을 때만(찐빵≠빵 오병합 방지). */
const MODIFIERS = [
  "다진",
  "채썬",
  "불린",
  "볶은",
  "삶은",
  "데친",
  "으깬",
  "손질된",
  "손질한",
  "냉동",
  "익힌",
  "찐",
];

/** 공백 제거 — 표기 편차("닭 가슴살" vs "닭가슴살")를 하나로. */
function compact(name: string): string {
  return name.replace(/\s+/g, "");
}

/** 손질 수식어 접두를 뗀다. 남는 글자가 2자 미만이면 원형 유지(고유 음식명 보호). */
function stripModifier(name: string): string {
  for (const m of MODIFIERS) {
    if (name.startsWith(m) && name.length >= m.length + 2) return name.slice(m.length);
  }
  return name;
}

export function buildCanonicalMap(masters: { name: string; aliases: string[] }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of masters) {
    map.set(compact(m.name), m.name);
    for (const alias of m.aliases) map.set(compact(alias), m.name);
  }
  return map;
}

export function canonicalize(name: string, map: Map<string, string>): string {
  const c = compact(name);
  const direct = map.get(c);
  if (direct) return direct;
  const stripped = stripModifier(c);
  return map.get(stripped) ?? stripped;
}
