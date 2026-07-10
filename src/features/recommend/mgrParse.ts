/**
 * 만개의레시피(TB_RECIPE_SEARCH 공공 덤프) 파싱 — 순수 함수 (scripts/ingest-10000recipe.ts에서 사용).
 *
 * 덤프 특성: CP949 인코딩(사전에 UTF-8 변환 필요) · 조리 단계 없음(재료+메타만) ·
 * 재료는 "[재료] 당면 1줌반| 당근 약간 [양념] 간장 2T| …" 형식(섹션 라벨 + '|' 구분 + 수량 접미).
 * 조리법 원문은 https://www.10000recipe.com/recipe/<RCP_SNO> — id `mgr-<sno>`로 클라가 링크 유도.
 */

/** RFC4180 CSV 파싱 — 따옴표 필드·이스케이프("")·필드 내 콤마/줄바꿈 지원. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** 수량이 숫자 없이 말로만 붙는 경우 ("멸치육수 적당량", "통깨 약간"). */
const AMOUNT_WORDS = /\s*(약간|적당량|적당히|조금|취향껏|기호에\s*따라|한\s*줌|반\s*줌)$/;

/**
 * 재료 원문 → 재료명 배열.
 * "[재료] 당면 1줌반| 소고기(국거리용)| (집)국간장 4T [양념] 간장 10큰술" → [당면, 소고기, 국간장, 간장]
 * 섹션 라벨([재료]·[양념]·[고기밑간]…)은 구분자로 치환(내용물은 전부 재료로 유지),
 * 괄호 주석·첫 숫자부터의 수량 접미·수량 단어를 제거. 중복 제거.
 */
export function parseMgrIngredients(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const tokens = raw
    .replace(/\[[^\]]*\]/g, "|") // 섹션 라벨 → 구분자
    .split("|");
  for (const t of tokens) {
    const name = t
      .replace(/\([^)]*\)/g, " ") // 괄호 주석 제거 — 소고기(국거리용)→소고기
      .replace(/[0-9½⅓¼⅔¾][^|]*$/, "") // 첫 숫자(분수 포함)부터 끝까지 = 수량
      .trim() // AMOUNT_WORDS의 $ 앵커가 후행 공백에 막히지 않게 먼저 정리
      .replace(AMOUNT_WORDS, "")
      .replace(/[·.,~!?*♡+\-]+$/, "")
      .trim()
      .replace(/\s{2,}/g, " ");
    if (name.length < 1 || name.length > 20) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/** "30분이내"→30 · "5분이내"→5 · "2시간이내/이상"→120 · 그 외/빈값 → null. */
export function parseMgrMinutes(timeNm: string): number | null {
  const h = timeNm.match(/^(\d+)시간/);
  if (h) return parseInt(h[1], 10) * 60;
  const m = timeNm.match(/^(\d+)분/);
  return m ? parseInt(m[1], 10) : null;
}

/** "2인분"→2 · "6인분이상"→6 · 빈값→2(만개 레시피 기본 표기 최빈값). */
export function parseMgrServings(inbunNm: string): number {
  const m = inbunNm.match(/^(\d+)/);
  return m ? Math.max(1, Math.min(9, parseInt(m[1], 10))) : 2;
}

/** 종류(CKG_KND_ACTO_NM) → 카드 이모지. */
const KIND_EMOJI: Record<string, string> = {
  밑반찬: "🥢",
  메인반찬: "🍳",
  "국/탕": "🍲",
  찌개: "🥘",
  "밥/죽/떡": "🍚",
  "면/만두": "🍜",
  샐러드: "🥗",
  양식: "🍝",
  "김치/젓갈/장류": "🥬",
  스프: "🥣",
};

export function emojiForKind(knd: string): string {
  return KIND_EMOJI[knd] ?? "🍳";
}

/** id `mgr-<sno>` ↔ 만개의레시피 원문 URL (클라 RecipeDetailModal '조리법 보기' 링크 공용). */
export const MGR_ID_PREFIX = "mgr-";

export function mgrSourceUrl(recipeId: string): string | null {
  if (!recipeId.startsWith(MGR_ID_PREFIX)) return null;
  return `https://www.10000recipe.com/recipe/${recipeId.slice(MGR_ID_PREFIX.length)}`;
}
