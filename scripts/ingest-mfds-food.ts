import { PrismaClient } from "@prisma/client";
import {
  buildFoodEntries,
  MAX_SERVING_KCAL,
  type NutriRow,
} from "../src/features/record/foodDict";

/**
 * 식약처 통합 식품영양성분 DB(음식) → FoodNutrition(음식 영양 사전) 적재.
 *
 * 실행: `npx tsx scripts/ingest-mfds-food.ts`   (.env의 NUTRITION_API_KEY 필요)
 *  - 공공데이터포털 '전국통합식품영양성분정보 표준데이터' API에서 typeNm=음식(약 1.96만 행)만 받는다.
 *    외식(프랜차이즈)·급식·가정식이 들어 있다. 호출 약 20회(개발계정 하루 1만 회 한도와 무관).
 *  - 이름별로 묶어 대표 1인분 kcal을 정한다 — 규칙과 근거는 foodDict.ts와 그 테스트.
 *  - 멱등: source='mfds_dish' 행을 새 결과로 통째 교체한다(한 트랜잭션).
 *    기록(MealRecord)은 제목·kcal 스냅샷을 저장하고 이 표를 참조하지 않으므로 교체해도 안전하다.
 *  - 결과가 비정상적으로 적으면(API 장애·응답 변경) DB를 건드리지 않고 멈춘다.
 *
 * ⚠️ 먼저 마이그레이션이 적용돼 있어야 한다: `npx prisma migrate dev --name food_nutrition`
 */
process.loadEnvFile(".env");

const ENDPOINT = "https://api.data.go.kr/openapi/tn_pubr_public_nutri_info_api";
const PAGE_SIZE = 1000;
const SOURCE = "mfds_dish";
const MIN_EXPECTED = 5000; // 2026-09 기준 약 1.5만 개가 나온다 — 이보다 훨씬 적으면 뭔가 잘못됐다

const KEY = process.env.NUTRITION_API_KEY ?? "";
const SERVICE_KEY = KEY.includes("%") ? KEY : encodeURIComponent(KEY);
const db = new PrismaClient();

/** 에러 메시지에 URL(=키)이 섞여 로그로 새지 않게 가린다. */
function redact(message: string): string {
  return KEY ? message.replaceAll(KEY, "<KEY>").replaceAll(SERVICE_KEY, "<KEY>") : message;
}

async function fetchPage(page: number): Promise<{ rows: NutriRow[]; total: number }> {
  const params = new URLSearchParams({
    pageNo: String(page),
    numOfRows: String(PAGE_SIZE),
    type: "json",
    typeNm: "음식",
  });
  const url = `${ENDPOINT}?serviceKey=${SERVICE_KEY}&${params}`;

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

  const first = await fetchPage(1);
  const pages = Math.ceil(first.total / PAGE_SIZE);
  const rows = [...first.rows];
  for (let p = 2; p <= pages; p++) {
    rows.push(...(await fetchPage(p)).rows);
    console.log(`… ${p}/${pages}`);
  }
  console.log(`수집 ${rows.length}행 (API 전체 ${first.total})`);

  const entries = buildFoodEntries(rows);
  console.log(
    `사전 ${entries.length}개로 정리 — 1인분 ${MAX_SERVING_KCAL}kcal 초과·계산 불가 제외, 이름별 대표값`,
  );
  if (entries.length < MIN_EXPECTED) {
    throw new Error(`결과가 너무 적어요(${entries.length}개) — API 응답을 확인하세요. DB는 건드리지 않았어요.`);
  }

  await db.$transaction(
    async (tx) => {
      await tx.foodNutrition.deleteMany({ where: { source: SOURCE } });
      for (let i = 0; i < entries.length; i += PAGE_SIZE) {
        await tx.foodNutrition.createMany({
          data: entries.slice(i, i + PAGE_SIZE).map((e) => ({ ...e, source: SOURCE })),
        });
      }
    },
    { timeout: 180_000 },
  );
  console.log(`🍽️ 적재 완료 — food_nutrition ${entries.length}행 (source=${SOURCE})`);
}

main()
  .catch((e) => {
    console.error(redact(e instanceof Error ? e.message : String(e)));
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
