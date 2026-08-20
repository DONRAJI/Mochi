/**
 * 재료 한 줄에서 **그램수를 추정**한다 (만개의레시피 덤프는 영양 정보를 안 준다).
 *
 * 원래 인제스트 스크립트 안에 인라인으로 있었는데, 테스트가 없어 800배 오차가 그대로
 * 배포됐다("국물용 멸치 10마리" → 8,000g → 양배추된장국 2,061kcal). 순수 모듈로 빼서
 * 실제 덤프 문자열로 고정한다.
 *
 * 원칙: **단위는 숫자 뒤에 와야 인정한다.** 예전엔 `/(모)/`처럼 토큰 아무 데나 그 글자가
 * 있으면 잡혀서, 이름에 우연히 들어간 글자가 단위로 오인됐다.
 */

/** 열량을 0으로 볼 재료 — 향신·물·육수 부재료(우려내고 건져낸다). */
export const ZERO_KCAL = new Set([
  "소금", "후추", "후춧가루", "고춧가루", "고추가루", "물",
  "통깨", "참깨", "깨소금", "식초", "다시마",
]);

/**
 * 수량 표기 — 아라비아 숫자 또는 분수 기호. 단위 앞에 이게 있어야 단위로 인정한다.
 * 문자열이 아니라 **정규식 리터럴의 source**를 쓴다: 문자열로 쓰면 `\d`를 `\d`로
 * 이스케이프해야 하고, 한 번 빠뜨리면 조용히 `d`가 돼 아무것도 매칭하지 않는다.
 */
const QTY = /(?:\d+(?:[./]\d+)?|[½⅓¼⅔¾])/.source;

/** `단위` 앞에 수량이 붙어 있는지. (예전 버그: 이름 속 글자를 단위로 오인) */
function hasUnit(token: string, unit: string): boolean {
  return new RegExp(QTY + /\s*/.source + `(?:${unit})`).test(token);
}

/**
 * '마리' 한 마리의 무게 — **여기가 2,061kcal 버그의 진원지**였다.
 * 전부 800g(닭·생선 기준)으로 잡는 바람에 멸치 10마리가 8kg이 됐다.
 */
const PER_MARI: [RegExp, number][] = [
  [/멸치/, 1], // 국물용 멸치 1마리 ≈ 1g
  [/새우|칵테일새우/, 15],
  [/바지락|조개|홍합|굴|가리비/, 20],
  [/전복|소라/, 50],
  [/오징어|낙지|주꾸미|한치/, 250],
  [/게|꽃게|대게/, 300],
  [/고등어|갈치|조기|삼치|명태|동태|생선|가자미|병어/, 250],
  [/닭|오리|영계/, 800],
];
const DEFAULT_MARI = 200; // 못 맞히면 보수적으로 — 800은 대형 가금·생선 전용

/** '개/조각/장/…' 한 단위의 무게. 이름을 **앞에서부터** 맞춰 부분일치 오인을 막는다. */
const PER_PIECE: [RegExp, number][] = [
  // ⚠️ 양배추가 먼저. `/배추/`로 두면 양배추가 배추(800g)로 잡힌다 — 실제 버그였다.
  [/^양배추/, 1000], // 1통 ≈ 1kg
  [/^(무|배추|알배추|얼갈이배추|수박|늙은호박|단호박)/, 800],
  // '고추'로 끝나는 것 전부(청고추·홍고추·오이고추…) — 앞서 청고추가 기본 100g으로 잡혔다.
  [/^(마늘|생강|쪽파|실파)/, 5],
  [/고추$/, 5],
  [/^(방울토마토|새우|메추리알|호두|아몬드|바지락|조개|홍합|굴|멸치)/, 15],
  [/버섯/, 20],
  [/^(계란|달걀|노른자|흰자)/, 50],
  [/^양파/, 170],
  [/^당근/, 150],
  [/^대파/, 140],
];
const DEFAULT_PIECE = 100;

function lookup(table: [RegExp, number][], name: string, fallback: number): number {
  for (const [re, g] of table) if (re.test(name)) return g;
  return fallback;
}

/** 토큰에서 수량 값을 읽는다 — "1/2"는 0.5, 분수 기호도 인정. 없으면 1. */
export function readQuantity(token: string): number {
  const frac: Record<string, number> = { "½": 0.5, "⅓": 1 / 3, "¼": 0.25, "⅔": 2 / 3, "¾": 0.75 };
  const m = token.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]) / parseFloat(m[2]);
  const f = token.match(/[½⅓¼⅔¾]/);
  if (f) return frac[f[0]];
  const n = token.match(/(\d+(?:\.\d+)?)/);
  return n ? parseFloat(n[1]) : 1;
}

/**
 * 재료 토큰 → 그램. `isSpoon`은 양념류(스푼으로 세는 것)인지.
 * 우선순위: 명시 g/ml → 스푼 → 세는 단위 → 기본값.
 */
export function estimateGrams(token: string, name: string, isSpoon: boolean): number {
  // ① g·ml이 적혀 있으면 그게 정답 (덤프는 "양배추 1/4통(200g)"처럼 병기가 흔하다)
  const g = token.match(/(\d+(?:\.\d+)?)\s*(?:g|그램|gram|ml)/i);
  if (g) return parseFloat(g[1]);

  // ② 스푼류
  const spoon = token.match(/(\d+(?:\.\d+)?)\s*(?:스푼|T|큰술|수저)/i);
  if (spoon) return parseFloat(spoon[1]) * (/볼록|수북|듬뿍/.test(token) ? 13.5 : 8.5);
  if (/볼록하게\s*1스푼|듬뿍\s*1스푼/.test(token)) return 13.5;

  // ③ 세는 단위 — 반드시 수량 뒤에 와야 한다
  const qty = readQuantity(token);
  if (hasUnit(token, "포기")) return qty * 1500;
  if (hasUnit(token, "통")) return qty * lookup(PER_PIECE, name, DEFAULT_PIECE);
  if (hasUnit(token, "모")) return qty * 300; // 두부 1모
  if (hasUnit(token, "공기|그릇")) return qty * 200; // 밥 1공기
  if (hasUnit(token, "마리")) return qty * lookup(PER_MARI, name, DEFAULT_MARI);
  if (hasUnit(token, "줌|주먹")) return qty * 50;
  if (hasUnit(token, "톨")) return qty * (/마늘|생강/.test(name) ? 5 : 85);
  if (hasUnit(token, "토막")) {
    if (/^무/.test(name)) return qty * 150;
    if (/고기|돼지|소|육|스테이크/.test(name)) return qty * 100;
    return qty * 85;
  }
  if (hasUnit(token, "개|뿌리|장|조각|대|덩어리|송이|알|쪽")) {
    return qty * lookup(PER_PIECE, name, DEFAULT_PIECE);
  }

  // ④ 수량이 없는 경우
  if (/적당량|약간|조금/.test(token) && isSpoon) {
    return /(기름|오일|유|식용유)$/.test(name) ? 20 : 8.5;
  }
  if (isSpoon) return 8.5;
  return 50; // 완전 생략 — 보수적 기본량
}

/** 토큰에서 재료명만 남긴다 (수량·괄호주석·꾸밈말 제거). */
export function cleanIngredientName(token: string): string {
  return token
    .replace(/\([^)]*\)/g, "")
    .replace(/[0-9½⅓¼⅔¾][^|]*$/, "")
    .replace(/\s*(약간|적당량|적당히|조금|취향껏|기호에\s*따라|한\s*줌|반\s*줌)$/, "")
    .replace(/[·.,~!?*♡+\-]+$/, "")
    .trim()
    .replace(/\s{2,}/g, " ");
}
