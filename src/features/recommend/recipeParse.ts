/**
 * COOKRCP01(식약처 조리식품 레시피 DB) 원문 → 우리 Recipe 필드로 정제.
 * 재료(RCP_PARTS_DTLS)는 "연두부 75g(3/4모), …" 자유 텍스트라 이름만 추출(완벽하진 않음).
 */
const HEADERS = new Set([
  "고명", "양념", "양념장", "소스", "재료", "주재료", "부재료", "드레싱", "육수", "곁들임", "밑간",
]);
const TRAILING_UNITS = /\s*(약간|조금|적당량|톡톡|줄기|개|모|장|스푼|컵|큰술|작은술|봉지|쪽|알)$/g;

/** 재료 자유 텍스트 → 재료명 배열. (실데이터는 "●주재료 : …" 불릿·헤더를 씀) */
export function parseIngredientNames(raw: string, dishName?: string): string[] {
  if (!raw) return [];
  const cleaned = raw
    .replace(/●/g, "\n") // 섹션 불릿 → 줄바꿈
    .replace(/^[^:\n]{1,10}\s*:\s*/gm, ""); // 줄 앞 "주재료 :" 헤더 제거
  const names: string[] = [];
  for (const tok0 of cleaned.split(/[\n,]/).map((t) => t.trim()).filter(Boolean)) {
    const tok = tok0.replace(/^[●•·*-]\s*/, "").trim(); // 잔여 불릿 제거
    if (tok === dishName || HEADERS.has(tok) || tok.includes(":")) continue;
    let name = tok.split(/\s*\d/)[0].trim(); // 첫 숫자 이전
    name = name.replace(TRAILING_UNITS, "").replace(/[()]/g, "").trim();
    // 복합 재료 분리(?·&·/) → 각 조각의 공백 제거(순 두부→순두부). 너무 길면 문장 — 스킵.
    for (const part of name.replace(/^\?+/, "").split(/[?&/]/)) {
      const clean = part.replace(/\s+/g, "");
      if (!clean || clean.length > 12) continue;
      if (!names.includes(clean)) names.push(clean);
    }
  }
  return names;
}

/** 조리 단계 정제 — 앞 번호("1. ")·끝 잉여 알파벳(".a") 제거, 빈 단계 제외. */
export function cleanSteps(manuals: string[]): string[] {
  return manuals
    .map((m) => (m ?? "").trim())
    .filter(Boolean)
    .map((m) => m.replace(/^\d+\.\s*/, "").replace(/[a-z]$/i, "").trim());
}

/** COOKRCP01엔 조리시간이 없어 단계 수로 추정(10~60분). */
export function estimateMinutes(stepCount: number): number {
  return Math.min(60, Math.max(10, stepCount * 5));
}
