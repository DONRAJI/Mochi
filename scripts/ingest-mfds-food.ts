import { PrismaClient } from "@prisma/client";
import {
  brandKeyOf,
  buildFoodEntries,
  CONVENIENCE_CATEGORIES,
  CONVENIENCE_MAX_GRAMS,
  FOOD_SOURCE,
  MAX_SERVING_KCAL,
  type BuildOptions,
  type NutriRow,
} from "../src/features/record/foodDict";

/**
 * 식약처 식품영양성분 공공데이터 → FoodNutrition(음식 영양 사전) 적재.
 *
 * 실행 — 반드시 프로젝트 폴더(F:/Mochi/mochi)에서, .env의 NUTRITION_API_KEY 필요:
 *   npx -y tsx scripts/ingest-mfds-food.ts              # 음식(기본): 외식 프랜차이즈·급식·가정식
 *   npx -y tsx scripts/ingest-mfds-food.ts convenience  # 편의점 가공식품: 김밥·주먹밥·도시락·샌드위치
 *
 *  - 음식은 통합 엔드포인트(typeNm=음식, 약 1.96만 행). 가공식품 쪽엔 분류가 없어서 편의점류는
 *    가공식품 엔드포인트의 분류(foodLv4Nm)로 받는다. 둘 다 호출 수십 회(개발계정 하루 1만 회와 무관).
 *  - 메뉴별로 묶어 대표 1인분 kcal과 대중성(파는 곳 수)을 정한다 — 규칙과 근거는 foodDict.ts와 그 테스트.
 *  - 멱등: 대상 출처(source)의 행만 새 결과로 통째 교체한다(한 트랜잭션). 다른 출처는 건드리지 않는다.
 *    기록(MealRecord)은 제목·kcal 스냅샷을 저장하고 이 표를 참조하지 않으므로 교체해도 안전하다.
 *  - 결과가 비정상적으로 적으면(API 장애·응답 변경) DB를 건드리지 않고 멈춘다.
 */
process.loadEnvFile(".env");

const API = "https://api.data.go.kr/openapi/";
const PAGE_SIZE = 1000;

interface Profile {
  label: string;
  endpoint: string;
  source: string;
  /** 필터별로 따로 받아 합친다 — API 필터는 완전일치라 분류마다 한 번씩 */
  queries: Record<string, string>[];
  /** 이보다 훨씬 적으면 API 쪽이 잘못된 것으로 보고 멈춘다 */
  minExpected: number;
  toRow: (raw: Record<string, string>) => NutriRow;
  build: BuildOptions;
}

const PROFILES: Record<string, Profile> = {
  dish: {
    label: "음식",
    endpoint: API + "tn_pubr_public_nutri_info_api",
    source: FOOD_SOURCE.dish,
    queries: [{ typeNm: "음식" }],
    minExpected: 5000, // 2026-09 기준 메뉴 합친 뒤 1만여 개
    // 대중성은 프랜차이즈명으로 센다. 급식·가정식은 "해당없음"이라 foodDict가 출처 묶음으로 센다.
    toRow: (raw) => ({ ...(raw as unknown as NutriRow), brand: raw.companyNm }),
    build: {},
  },
  convenience: {
    label: "편의점 가공식품",
    endpoint: API + "tn_pubr_public_nutri_process_info_api",
    source: FOOD_SOURCE.convenience,
    queries: CONVENIENCE_CATEGORIES.map((c) => ({ foodLv4Nm: c })),
    minExpected: 2000, // 세 분류 고유 약 1.1만 행 → 메뉴로 묶으면 수천 개
    // 가공식품 이름엔 '분류_' 접두어가 없다 — 원본 분류 필드를 쓴다. 대중성은 제조사를 회사 단위로.
    toRow: (raw) => ({
      ...(raw as unknown as NutriRow),
      category: raw.foodLv4Nm,
      brand: brandKeyOf(raw.mfrNm),
    }),
    build: { maxAmountByCategory: CONVENIENCE_MAX_GRAMS },
  },
};

const KEY = process.env.NUTRITION_API_KEY ?? "";
const SERVICE_KEY = KEY.includes("%") ? KEY : encodeURIComponent(KEY);
const db = new PrismaClient();

/** 에러 메시지에 URL(=키)이 섞여 로그로 새지 않게 가린다. */
function redact(message: string): string {
  return KEY ? message.replaceAll(KEY, "<KEY>").replaceAll(SERVICE_KEY, "<KEY>") : message;
}

async function fetchPage(
  endpoint: string,
  query: Record<string, string>,
  page: number,
): Promise<{ rows: Record<string, string>[]; total: number }> {
  const params = new URLSearchParams({
    pageNo: String(page),
    numOfRows: String(PAGE_SIZE),
    type: "json",
    ...query,
  });
  const url = `${endpoint}?serviceKey=${SERVICE_KEY}&${params}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      const json = await res.json();
      const code = json?.header?.resultCode;
      if (code === "03") return { rows: [], total: 0 }; // NODATA
      if (code !== "00") throw new Error(`API 응답 ${code} ${json?.header?.resultMsg ?? ""}`);
      const item = json.body?.items?.item ?? [];
      return {
        rows: Array.isArray(item) ? item : [item],
        total: Number(json.body?.totalCount ?? 0),
      };
    } catch (e) {
      const msg = redact(e instanceof Error ? e.message : String(e));
      console.warn(`  page ${page} 재시도 ${attempt}/3: ${msg.slice(0, 100)}`);
      if (attempt === 3) throw new Error(`page ${page} 수집 실패 — DB는 건드리지 않았어요`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("unreachable");
}

async function main(): Promise<void> {
  if (!KEY) throw new Error("NUTRITION_API_KEY가 .env에 없어요");
  const target = process.argv[2] ?? "dish";
  const profile = PROFILES[target];
  if (!profile) throw new Error(`알 수 없는 대상 "${target}" — dish 또는 convenience`);
  console.log(`▶ ${profile.label} 적재 (source=${profile.source})`);

  const rows: NutriRow[] = [];
  for (const query of profile.queries) {
    const first = await fetchPage(profile.endpoint, query, 1);
    const pages = Math.ceil(first.total / PAGE_SIZE);
    const got = [...first.rows];
    for (let p = 2; p <= pages; p++) {
      got.push(...(await fetchPage(profile.endpoint, query, p)).rows);
      console.log(`  … ${Object.values(query).join(",")} ${p}/${pages}`);
    }
    console.log(`  ${Object.values(query).join(",")}: ${got.length}행 (API 전체 ${first.total})`);
    rows.push(...got.map(profile.toRow));
  }

  const entries = buildFoodEntries(rows, profile.build);
  const common = entries.filter((e) => e.popularity >= 2).length;
  console.log(
    `사전 ${entries.length}개로 정리(그중 2곳 이상에서 파는 메뉴 ${common}개) — 1인분 ${MAX_SERVING_KCAL}kcal 초과·계산 불가·중량 초과 제외, 핫/아이스·사이즈 합침`,
  );
  if (entries.length < profile.minExpected) {
    throw new Error(
      `결과가 너무 적어요(${entries.length}개) — API 응답을 확인하세요. DB는 건드리지 않았어요.`,
    );
  }

  await db.$transaction(
    async (tx) => {
      await tx.foodNutrition.deleteMany({ where: { source: profile.source } });
      for (let i = 0; i < entries.length; i += PAGE_SIZE) {
        await tx.foodNutrition.createMany({
          data: entries.slice(i, i + PAGE_SIZE).map((e) => ({ ...e, source: profile.source })),
        });
      }
    },
    { timeout: 180_000 },
  );
  console.log(`🍽️ 적재 완료 — food_nutrition ${entries.length}행 (source=${profile.source})`);
}

main()
  .catch((e) => {
    console.error(redact(e instanceof Error ? e.message : String(e)));
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
