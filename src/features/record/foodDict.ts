/**
 * 음식 영양 사전 만들기 (순수) — 식약처 식품영양성분 공공데이터의 행을 메뉴별 대표 1인분으로 묶는다.
 *
 * 왜: 직접 입력 기록은 이름만 남고 칼로리가 비었다. 공공 DB에는 외식(프랜차이즈)·급식·가정식 음식과
 * 편의점류 가공식품의 영양성분이 있지만, 같은 음식이 출처마다 여러 줄이고 값의 성격도 제각각이다.
 * 메뉴를 기준으로 묶어 '가장 믿을 만한 1인분 kcal' 하나를 정해 사전으로 쓴다(편의점·브랜드 구분 안 함).
 *
 * 대표값 규칙 — 실제 데이터에서 겪은 함정이 근거다(테스트에 실제 행 그대로):
 * 1. 1인분이 MAX_SERVING_KCAL를 넘으면 뺀다. 피자 L '한 판'(2,091kcal) 같은 전체 크기 행이 약 2,700개.
 *    이 값은 예산·기록으로 흘러가므로 1인분이 아닌 숫자는 없는 것보다 나쁘다(kcalEstimate와 같은 원칙).
 * 2. (선택) 분류별 한 포장 최대 중량을 넘으면 뺀다 — 편의점 가공식품에 급식·대용량이 섞여 있다.
 * 3. 핫/아이스·사이즈·용량 표기를 떼고 같은 메뉴로 묶는다. 카페만 이름 4,375개 → 2,547개.
 *    같은 브랜드 핫↔아이스 918쌍을 재 보니 아이스가 중앙값 −11%, 74%가 ±20% 이내 — 제안용으론 한 메뉴다.
 * 4. '기준량만 적힌 행'(1회 제공량 = 100g)은 1인분이 아니다. 비빔밥 100g 142kcal ← 실제는 450g 639kcal.
 * 5. 측정 방식이 가장 믿을 만한 층만 쓴다: 분석(실측) > 수집(업체·프랜차이즈 표기) > 산출(급식 레시피 계산).
 *    김치찌개는 급식 산출 200ml 38kcal가 4줄, 분석 400g 244kcal가 1줄 — 수로 뽑으면 38이 된다.
 * 6. 그 층 안에서 중앙값. 아메리카노는 브랜드 7곳 0~19kcal → 11kcal. 0kcal도 실제 값이라 버리지 않는다.
 *
 * 대중성(popularity) = 그 메뉴를 파는·만드는 **서로 다른 곳의 수**. "여러 브랜드가 파는 메뉴 = 대중적인 메뉴"
 * — 카페라떼 36곳·아메리카노 30곳, 편의점 햄치즈샌드위치 19곳. '밖에서 먹기' 제안에서 흔한 메뉴만 추리는 기준.
 */

export interface NutriRow {
  foodCd: string;
  foodNm: string;
  /** 기준량당 에너지(kcal). 문자열로 온다. */
  enerc: string;
  /** 영양성분 함량 기준량 — "100g" | "100ml" */
  nutConSrtrQua: string;
  /** 1회 제공량(식품중량) — "400g" | "370.80ml" | "" */
  foodSize: string;
  /** 분석 | 수집 | 산출 */
  dataProdNm: string;
  /**
   * 분류를 원본 필드에서 직접 줄 때(가공식품의 foodLv4Nm, 예: "도시락"). 없으면 이름의 '분류_' 접두어.
   */
  category?: string | null;
  /**
   * 파는·만드는 곳(음식: 프랜차이즈명, 가공식품: brandKeyOf로 정리한 제조사). 대중성을 셀 때 쓴다.
   * 없거나 "해당없음"이면 foodCd 앞 두 글자(출처 묶음 — 급식 대상별 D4~D7 등)로 센다.
   */
  brand?: string | null;
}

export type Unit = "g" | "ml";

export interface Amount {
  value: number;
  unit: Unit;
}

export interface FoodEntry {
  /** "mfds-" + 대표 행 foodCd — 원본 추적용 */
  id: string;
  name: string;
  category: string | null;
  searchKey: string;
  kcal: number;
  servingAmount: number;
  servingUnit: Unit;
  method: string;
  /** 묶인 원본 행 수 */
  variantCount: number;
  /** 파는·만드는 서로 다른 곳의 수 — 대중성 */
  popularity: number;
}

export interface BuildOptions {
  /** 분류별 한 포장 최대 양 — 넘는 행은 뺀다(급식·대용량·중량 오기). */
  maxAmountByCategory?: Readonly<Record<string, number>>;
}

export const MAX_SERVING_KCAL = 1500;
export const FOOD_ID_PREFIX = "mfds-";
/** 측정 방식 신뢰 순서 — 분석(실측) > 수집(업체 표기) > 산출(급식 레시피 계산). */
export const METHOD_PRIORITY = ["분석", "수집", "산출"] as const;

/** FoodNutrition.source — 적재 단위이자 '밖에서 먹기' 장소 구분 기준. */
export const FOOD_SOURCE = {
  /** 통합 DB의 음식(외식 프랜차이즈·급식·가정식) */
  dish: "mfds_dish",
  /** 가공식품 DB의 편의점류(김밥·주먹밥·도시락·샌드위치) */
  convenience: "mfds_convenience",
} as const;

/**
 * 편의점 가공식품 — 받아올 분류(가공식품 엔드포인트 foodLv4Nm)와 한 포장 최대 중량(g).
 * 2026-09 분포에서 편의점 단품과 급식·대용량 사이가 끊기는 지점으로 잡았다.
 */
export const CONVENIENCE_MAX_GRAMS: Readonly<Record<string, number>> = {
  "주먹밥/김밥/초밥": 500, // 중앙 215g · 90% 329g · 95% 670g — 위는 급식센터 대용량(충무김밥 1,105g)
  도시락: 700, // 중앙 363g · 90% 531g · 95% 700g
  샌드위치: 450, // 중앙 169g · 90% 280g · 95% 390g — 706g 같은 중량 오기가 섞여 있다
};

export const CONVENIENCE_CATEGORIES: readonly string[] = Object.keys(CONVENIENCE_MAX_GRAMS);

const AMOUNT = /([\d.]+)\s*(kg|g|ml|l)/i;

/** "370.80ml" · "100g(ml)" · "1.5L" → { value, unit }. 못 읽거나 0 이하면 null. */
export function parseAmount(s: string | null | undefined): Amount | null {
  const m = AMOUNT.exec(s ?? "");
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = m[2].toLowerCase();
  if (unit === "kg") return { value: value * 1000, unit: "g" };
  if (unit === "l") return { value: value * 1000, unit: "ml" };
  return { value, unit: unit as Unit };
}

/** 빈 문자열을 0으로 읽지 않는다 — `Number("")`는 0이라 '값 없음'이 '0kcal'로 둔갑한다. */
function toNumber(s: string | null | undefined): number | null {
  if (s == null || s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 1인분 kcal = 기준량당 에너지 × 1회 제공량 ÷ 기준량. 값이 없거나 단위(g/ml)가 다르면 null. */
export function servingKcal(
  row: Pick<NutriRow, "enerc" | "nutConSrtrQua" | "foodSize">,
): number | null {
  const energy = toNumber(row.enerc);
  const base = parseAmount(row.nutConSrtrQua);
  const size = parseAmount(row.foodSize);
  if (energy == null || energy < 0 || !base || !size || base.unit !== size.unit) return null;
  return (energy * size.value) / base.value;
}

/** 세트 상품 표시 — 이 뒤가 실제 메뉴명이다("햄버거_간편조리세트_새우버거"). */
const SET_MARKER = "간편조리세트";

/**
 * 메뉴가 아니라 분류를 꾸미는 말. "햄버거_치즈"는 치즈가 아니라 치즈 햄버거, "닭튀김_양념"은 양념 치킨이다.
 * 2026-09 데이터에서 버거·치킨 목록에 "양념"·"치즈"·"닭가슴살"이 메뉴처럼 올라온 것들.
 */
const QUALIFIER_NAMES = new Set([
  "양념",
  "치즈",
  "간장",
  "매운맛",
  "다리",
  "날개",
  "닭가슴살",
  "치킨",
]);

/**
 * "커피_아메리카노 핫(HOT)" → { category: "커피", name: "아메리카노 핫(HOT)" }. 밑줄이 없으면 분류 없음.
 * 밑줄 뒤가 늘 메뉴명은 아니라서(2026-09, 두 번 이상 쓴 이름 454개를 보고 정한 규칙):
 * - 세트: "햄버거_간편조리세트_새우버거" → 새우버거 (세트 표시 뒤)
 * - 재료 나열: "오이생채_오이_부추"·"햄버거_소고기패티_토마토_양상추" → 앞이 음식 (뒤는 재료)
 * - 꾸미는 말: "햄버거_치즈" → 치즈 햄버거
 */
export function splitFoodName(foodNm: string): { category: string | null; name: string } {
  const raw = foodNm.trim();
  const parts = raw
    .split("_")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return { category: null, name: raw };
  const category = parts[0];

  const setAt = parts.indexOf(SET_MARKER);
  if (setAt >= 0) {
    const rest = parts.slice(setAt + 1).join(" ");
    return { category, name: rest || category };
  }
  if (parts.length >= 3) return { category, name: category };
  if (QUALIFIER_NAMES.has(parts[1])) return { category, name: `${parts[1]} ${category}` };
  return { category, name: parts[1] };
}

/** 메뉴를 가르지 않는 표기 — 온도·사이즈. 소문자로 비교한다. */
const TEMPERATURE_TOKENS = new Set([
  "핫",
  "아이스",
  "hot",
  "iced",
  "ice",
  "따뜻한",
  "차가운",
  "뜨거운",
]);
const SIZE_TOKENS = new Set([
  "l",
  "r",
  "m",
  "s",
  "xl",
  "large",
  "regular",
  "medium",
  "small",
  "tall",
  "grande",
  "venti",
  "레귤러",
  "라지",
  "미디엄",
  "스몰",
  "톨",
  "그란데",
  "벤티",
]);
const VOLUME_TOKEN = /^\d+(\.\d+)?(ml|l|oz|g|온스)$/i;

function isVariantToken(token: string): boolean {
  const low = token.toLowerCase();
  return TEMPERATURE_TOKENS.has(low) || SIZE_TOKENS.has(low) || VOLUME_TOKEN.test(token);
}

/**
 * 핫/아이스·사이즈·용량 표기를 뗀 메뉴 이름. "카페 라떼 아이스(ICED)" → "카페 라떼", "국민반반 피자 (L)" → "국민반반 피자".
 * 따로 떨어진 단어만 뗀다 — "아이스티"·"아이스크림"은 메뉴명이라 그대로. 괄호도 안이 전부 표기일 때만
 * 지운다 — "홍합국(홍합탕)"은 그대로. 전부 지워지면 원래 이름을 쓴다.
 */
export function baseFoodName(name: string): string {
  const withoutVariantGroups = name.replace(/\(([^)]*)\)/g, (group, inner: string) => {
    const tokens = inner.split(/\s+/).filter(Boolean);
    return tokens.length > 0 && tokens.every(isVariantToken) ? " " : group;
  });
  const kept = withoutVariantGroups
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !isVariantToken(t));
  return kept.length > 0 ? kept.join(" ") : name.trim();
}

/**
 * 제조사 이름을 회사 단위로 — 공장·지점·법인 표기를 떼어 대중성을 '공장 수'가 아니라 '회사 수'로 센다.
 * "(주)원푸드림 주촌지점" → "원푸드림", "롯데후레쉬델리카제2호(주)"·"롯데후레쉬델리카제3호주식회사" → "롯데후레쉬델리카".
 */
export function brandKeyOf(raw: string | null | undefined): string | null {
  // 법인 표기를 먼저 지운다 — "(주) 원푸드림"처럼 띄어 쓰면 첫 단어가 "(주)"만 남는다.
  const plain = (raw ?? "").replace(/\(주\)|㈜|\(주|주\)|주식회사|농업회사법인|영농조합법인/g, " ");
  const first = plain.split(/[\s/]+/).find(Boolean) ?? "";
  const key = first.replace(/제?\d+호.*$/, "");
  return key && key !== "해당없음" ? key : null;
}

/** 공백 제거·소문자 — 부분일치 검색 키. 기록 화면의 카탈로그 매칭(catalogMatch)과 같은 정규화. */
export function searchKeyOf(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mostCommon(xs: readonly (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const x of xs) if (x) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

interface Candidate {
  row: NutriRow;
  kcal: number;
  size: Amount;
  base: Amount;
  name: string;
  category: string | null;
  sellerKey: string;
}

/** 원본 행들 → 메뉴별 대표 1인분 사전. 순서는 이름순. */
export function buildFoodEntries(
  rows: readonly NutriRow[],
  options: BuildOptions = {},
): FoodEntry[] {
  const seen = new Set<string>();
  const groups = new Map<string, Candidate[]>();

  for (const row of rows) {
    // API가 같은 행을 두 번씩 돌려주는 경우가 있다(가공식품 쪽은 절반이 중복이었다).
    if (seen.has(row.foodCd)) continue;
    seen.add(row.foodCd);

    const split = splitFoodName(row.foodNm);
    const name = baseFoodName(split.name);
    const category = row.category ?? split.category;
    if (!name) continue;

    const kcal = servingKcal(row);
    const size = parseAmount(row.foodSize);
    const base = parseAmount(row.nutConSrtrQua);
    if (kcal == null || !size || !base || kcal > MAX_SERVING_KCAL) continue;

    // 분류별 한 포장 최대 양 — 넘으면 급식·대용량이거나 중량 오기다.
    const cap = category ? options.maxAmountByCategory?.[category] : undefined;
    if (cap != null && size.value > cap) continue;

    const brand = row.brand && row.brand !== "해당없음" ? row.brand : null;
    const sellerKey = brand ?? row.foodCd.slice(0, 2);

    const key = searchKeyOf(name);
    const list = groups.get(key) ?? [];
    list.push({ row, kcal, size, base, name, category, sellerKey });
    groups.set(key, list);
  }

  const entries: FoodEntry[] = [];
  for (const [key, all] of groups) {
    const realServings = all.filter(
      (c) => !(c.size.unit === c.base.unit && c.size.value === c.base.value),
    );
    const pool = realServings.length > 0 ? realServings : all;
    const tier =
      METHOD_PRIORITY.map((m) => pool.filter((c) => c.row.dataProdNm === m)).find(
        (t) => t.length > 0,
      ) ?? pool;

    const mid = median(tier.map((c) => c.kcal));
    const rep = tier.reduce((best, c) =>
      Math.abs(c.kcal - mid) < Math.abs(best.kcal - mid) ? c : best,
    );

    entries.push({
      id: FOOD_ID_PREFIX + rep.row.foodCd,
      name: rep.name,
      category: mostCommon(all.map((c) => c.category)),
      searchKey: key,
      kcal: Math.round(mid),
      servingAmount: rep.size.value,
      servingUnit: rep.size.unit,
      method: rep.row.dataProdNm,
      variantCount: all.length,
      popularity: new Set(all.map((c) => c.sellerKey)).size,
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}
