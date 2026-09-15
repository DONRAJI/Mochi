/**
 * 직접 입력 기록의 이름을 외식·편의점 카탈로그와 맞춰본다 (순수).
 *
 * 왜: 직접 입력은 이름만 남고 kcal은 사용자가 손으로 적어야 했다(대부분 비워둔다).
 * 그런데 외식·편의점 카탈로그 72개에는 kcal이 이미 있고, 특히 편의점은 포장 표기값이라
 * 가장 정확하다. 적은 이름이 카탈로그와 맞으면 **그 항목으로 기록**하게 제안한다 —
 * 그러면 서버가 kcal을 붙이므로, 숫자를 숨기는(cozy) 사용자의 기록도 정확해진다(불변 #2).
 *
 * 추천 모드로는 거의 안 쓰이던 카탈로그를 '칼로리 사전'으로 쓰는 셈이다.
 */

export type CatalogMode = "eatout" | "convenience";

export interface CatalogCandidate {
  id: string;
  name: string;
  mode: CatalogMode;
  emoji: string | null;
  /** 외식 = 분류(한식…), 편의점 = 브랜드(GS25…) */
  subtitle: string | null;
  /** cozy 사용자에겐 서버가 null로 보낸다 — 받은 것만 그린다(불변 #2) */
  kcal: number | null;
}

/** 한 글자로는 너무 많이 걸린다("밥" → 삼각김밥·비빔밥·볶음밥…). */
export const MIN_QUERY_LENGTH = 2;
/** 시트 안에서 입력칸 아래에 붙으므로 짧게. */
export const MAX_SUGGESTIONS = 3;

/** 공백·대소문자를 무시한다 — "참치 마요" = "참치마요", "GS25" = "gs25". */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/**
 * 이름으로 카탈로그 후보를 찾는다.
 * 점수: 정확히 같음 3 > 앞부분 일치 2 > 포함 1. 같은 점수면 이름이 짧은 쪽(더 구체적)이 먼저.
 * "점심에 쌀국수"처럼 문장으로 적어도 이름이 들어 있으면 찾는다(역포함).
 */
export function matchCatalog(
  query: string,
  items: readonly CatalogCandidate[],
  limit = MAX_SUGGESTIONS,
): CatalogCandidate[] {
  const q = normalizeName(query);
  if (q.length < MIN_QUERY_LENGTH) return [];

  const scored: { item: CatalogCandidate; score: number; len: number }[] = [];
  for (const item of items) {
    const n = normalizeName(item.name);
    let score = 0;
    if (n === q) score = 3;
    else if (n.startsWith(q)) score = 2;
    else if (n.includes(q) || q.includes(n)) score = 1;
    if (score > 0) scored.push({ item, score, len: n.length });
  }
  scored.sort((a, b) => b.score - a.score || a.len - b.len);

  const seen = new Set<string>();
  const out: CatalogCandidate[] = [];
  for (const { item } of scored) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
