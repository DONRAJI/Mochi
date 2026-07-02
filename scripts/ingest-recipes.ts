import { PrismaClient } from "@prisma/client";
import { parseIngredientNames, cleanSteps, estimateMinutes } from "../src/features/recommend/recipeParse";

/**
 * 식약처 조리식품 레시피 DB(COOKRCP01) → Recipe 테이블 적재.
 * 실행: `npx tsx scripts/ingest-recipes.ts [최대개수]`  (키는 .env의 RECIPE_API_KEY)
 * 멱등: id `cookrcp-<RCP_SEQ>`로 upsert.
 */
process.loadEnvFile(".env");

const KEY = process.env.RECIPE_API_KEY;
const LIMIT = Number(process.argv[2]) || Infinity;
const CHUNK = 100;
const db = new PrismaClient();

type Row = Record<string, string>;

function toInt(s: string | undefined): number | null {
  const n = parseInt(s ?? "", 10);
  return Number.isFinite(n) ? n : null;
}

/** 완성 요리 사진 URL을 https로(배포 https에서 mixed-content 방지). 없으면 null. */
function toHttps(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://");
}

async function fetchPage(start: number, end: number): Promise<{ total: number; rows: Row[] }> {
  const res = await fetch(
    `http://openapi.foodsafetykorea.go.kr/api/${KEY}/COOKRCP01/json/${start}/${end}`,
  );
  const json = (await res.json()) as {
    COOKRCP01?: { total_count?: string; row?: Row[]; RESULT?: { CODE?: string; MSG?: string } };
  };
  const body = json.COOKRCP01;
  if (!body) throw new Error(`응답 형식 오류: ${JSON.stringify(json).slice(0, 200)}`);
  if (!body.row && body.RESULT?.CODE && body.RESULT.CODE !== "INFO-000") {
    throw new Error(`API 오류: ${body.RESULT.CODE} ${body.RESULT.MSG}`);
  }
  return { total: Number(body.total_count ?? 0), rows: body.row ?? [] };
}

async function main(): Promise<void> {
  if (!KEY) throw new Error("RECIPE_API_KEY가 .env에 없습니다.");
  let start = 1;
  let total = Infinity;
  let count = 0;

  while (start <= Math.min(total, LIMIT)) {
    const end = start + CHUNK - 1;
    const { total: t, rows } = await fetchPage(start, end);
    total = t;
    if (rows.length === 0) break;

    for (const r of rows) {
      const manuals: string[] = [];
      for (let i = 1; i <= 20; i++) manuals.push(r[`MANUAL${String(i).padStart(2, "0")}`] ?? "");
      const steps = cleanSteps(manuals);
      const data = {
        name: r.RCP_NM,
        minutes: estimateMinutes(steps.length),
        kcal: toInt(r.INFO_ENG),
        protein: toInt(r.INFO_PRO),
        imageUrl: toHttps(r.ATT_FILE_NO_MAIN),
        ingredients: parseIngredientNames(r.RCP_PARTS_DTLS ?? "", r.RCP_NM),
        steps,
      };
      await db.recipe.upsert({
        where: { id: `cookrcp-${r.RCP_SEQ}` },
        create: { id: `cookrcp-${r.RCP_SEQ}`, servings: 1, rarity: "common", ...data },
        update: data,
      });
      count += 1;
    }
    console.log(`… ${Math.min(end, total)}/${total}`);
    start += CHUNK;
  }
  console.log(`🧊 레시피 인제스트 완료: ${count}개`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
