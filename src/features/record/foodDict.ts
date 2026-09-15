/**
 * 음식 영양 사전 만들기 (순수) — 식약처 통합 식품영양성분 DB의 행을 이름별 대표 1인분으로 묶는다.
 *
 * 왜: 직접 입력 기록은 이름만 남고 칼로리가 비었다. 공공 DB에는 외식(프랜차이즈)·급식·가정식 음식과
 * 편의점류 가공식품의 영양성분이 있지만, 같은 음식이 출처마다 여러 줄이고 값의 성격도 제각각이다.
 * 이름을 기준으로 묶어 '가장 믿을 만한 1인분 kcal' 하나를 정해 사전으로 쓴다(편의점·브랜드 구분 안 함).
 *
 * 대표값 규칙 — 실제 데이터에서 겪은 함정이 근거다(테스트에 실제 행 그대로):
 * 1. 1인분이 MAX_SERVING_KCAL를 넘으면 뺀다. 피자 L '한 판'(2,091kcal) 같은 전체 크기 행이 약 2,700개.
 *    이 값은 예산·기록으로 흘러가므로 1인분이 아닌 숫자는 없는 것보다 나쁘다(kcalEstimate와 같은 원칙).
 * 2. (선택) 분류별 한 포장 최대 중량을 넘으면 뺀다 — 편의점 가공식품에 급식·대용량이 섞여 있다.
 * 3. '기준량만 적힌 행'(1회 제공량 = 100g)은 1인분이 아니다. 비빔밥 100g 142kcal ← 실제는 450g 639kcal.
 * 4. 측정 방식이 가장 믿을 만한 층만 쓴다: 분석(실측) > 수집(업체·프랜차이즈 표기) > 산출(급식 레시피 계산).
 *    김치찌개는 급식 산출 200ml 38kcal가 4줄, 분석 400g 244kcal가 1줄 — 수로 뽑으면 38이 된다.
 * 5. 그 층 안에서 중앙값. 아메리카노는 브랜드 7곳 0~19kcal → 11kcal. 0kcal도 실제 값이라 버리지 않는다.
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
}

export type Unit = "g" | "ml";

export interface Amount {
  value: number;
  unit: Unit;
}

export interface FoodEntry {
  /** "mfds-" + 대표 행 foodCd — 원본 추적용이자 재적재해도 같은 값 */
  id: string;
  name: string;
  category: string | null;
  searchKey: string;
  kcal: number;
  servingAmount: number;
  servingUnit: Unit;
  method: string;
  variantCount: number;
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

/** "커피_아메리카노 핫(HOT)" → { category: "커피", name: "아메리카노 핫(HOT)" }. 밑줄이 없으면 분류 없음. */
export function splitFoodName(foodNm: string): { category: string | null; name: string } {
  const raw = foodNm.trim();
  const i = raw.indexOf("_");
  if (i <= 0 || i === raw.length - 1) return { category: null, name: raw };
  return { category: raw.slice(0, i).trim(), name: raw.slice(i + 1).trim() };
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
}

/** 원본 행들 → 이름별 대표 1인분 사전. 순서는 이름순. */
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
    const name = split.name;
    const category = row.category ?? split.category;
    if (!name) continue;

    const kcal = servingKcal(row);
    const size = parseAmount(row.foodSize);
    const base = parseAmount(row.nutConSrtrQua);
    if (kcal == null || !size || !base || kcal > MAX_SERVING_KCAL) continue;

    // 분류별 한 포장 최대 양 — 넘으면 급식·대용량이거나 중량 오기다.
    const cap = category ? options.maxAmountByCategory?.[category] : undefined;
    if (cap != null && size.value > cap) continue;

    const key = searchKeyOf(name);
    const list = groups.get(key) ?? [];
    list.push({ row, kcal, size, base, name, category });
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
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}
