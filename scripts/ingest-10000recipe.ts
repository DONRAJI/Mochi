import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  parseCsv,
  parseMgrIngredients,
  parseMgrMinutes,
  parseMgrServings,
  emojiForKind,
  MGR_ID_PREFIX,
} from "../src/features/recommend/mgrParse";

/**
 * 만개의레시피 공공 덤프(TB_RECIPE_SEARCH*.csv) → Recipe 테이블 적재 파이프라인.
 *
 * 실행: `npx tsx scripts/ingest-10000recipe.ts <csv-디렉토리> [top개수=1000]`
 *  - 디렉토리의 *.csv 전부를 파일명 순(=날짜 순)으로 읽어 같은 RCP_SNO는 최신 파일이 덮어씀.
 *  - ⚠️ 원본 덤프는 CP949 — 먼저 UTF-8로 변환해 둘 것: `iconv -f CP949 -t UTF-8 in.csv > out.csv`
 *    (스크립트가 U+FFFD 비율로 인코딩을 검사하고 아니면 중단한다.)
 *
 * 페르소나 큐레이션(20대 자취·다이어트, docs/PRD.md):
 *  - 난이도 아무나/초급 · 조리시간 ≤30분 · 재료 3~12개 · 요리명 있는 것만
 *  - 상황 제외: 명절/이유식/손님접대/야식 · 종류 제외: 디저트/빵/과자/차·음료·술/퓨전/기타
 *  - 같은 요리명(CKG_NM)은 조회수 최고(동률이면 추천수) 1개만 — 사용자 지정 dedup 규칙
 *  - 조회수 상위 top개만 적재(기본 1000 ≈ 조회수 10만 이상의 검증된 국민 레시피)
 *
 * 결과 행: id `mgr-<RCP_SNO>`(원문 링크 유도용), steps 없음(원문은 만개의레시피 링크로),
 * kcal/protein/imageUrl 없음(덤프 미제공). 재실행 시 top셋 밖으로 밀려난 옛 mgr- 행은 정리.
 */
process.loadEnvFile(".env");

const DIR = process.argv[2];
const TOP = Number(process.argv[3]) || 1000;
const db = new PrismaClient();

const EASY = new Set(["아무나", "초급"]);
const EXCLUDE_STA = new Set(["명절", "이유식", "손님접대", "야식"]);
const EXCLUDE_KND = new Set(["디저트", "빵", "과자", "차/음료/술", "퓨전", "기타"]);
const MAX_MINUTES = 30;

interface MgrRow {
  sno: string;
  nm: string; // 요리명(CKG_NM) — 카드 제목·dedup 키
  inq: number; // 조회수
  rcmm: number; // 추천수
  knd: string;
  sta: string;
  dodf: string;
  minutes: number | null;
  servings: number;
  ingredients: string[];
}

function loadMerged(dir: string): Map<string, MgrRow> {
  const bySno = new Map<string, MgrRow>();
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".csv")).sort();
  if (files.length === 0) throw new Error(`${dir} 에 csv가 없습니다.`);

  for (const f of files) {
    const text = readFileSync(join(dir, f), "utf8");
    const mojibake = (text.slice(0, 1_000_000).match(/�/g) ?? []).length;
    if (mojibake > 1000) {
      throw new Error(`${f} 가 UTF-8이 아닙니다(CP949 원본?). iconv -f CP949 -t UTF-8 로 변환 후 재시도.`);
    }
    const rows = parseCsv(text);
    const header = rows[0];
    const idx = (n: string) => header.indexOf(n);
    const I = {
      sno: idx("RCP_SNO"),
      ttl: idx("RCP_TTL"),
      nm: idx("CKG_NM"),
      inq: idx("INQ_CNT"),
      rcmm: idx("RCMM_CNT"),
      sta: idx("CKG_STA_ACTO_NM"),
      knd: idx("CKG_KND_ACTO_NM"),
      mtrl: idx("CKG_MTRL_CN"),
      inbun: idx("CKG_INBUN_NM"),
      dodf: idx("CKG_DODF_NM"),
      time: idx("CKG_TIME_NM"),
    };
    let n = 0;
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length < header.length - 1) continue;
      if (row[I.ttl] === "RCP_TTL") continue; // 덤프에 섞인 중복 헤더 파편
      const sno = row[I.sno];
      if (!sno || !/^\d+$/.test(sno)) continue;
      bySno.set(sno, {
        sno,
        nm: (row[I.nm] ?? "").trim(),
        inq: parseInt(row[I.inq] ?? "0", 10) || 0,
        rcmm: parseInt(row[I.rcmm] ?? "0", 10) || 0,
        knd: row[I.knd] ?? "",
        sta: row[I.sta] ?? "",
        dodf: row[I.dodf] ?? "",
        minutes: parseMgrMinutes(row[I.time] ?? ""),
        servings: parseMgrServings(row[I.inbun] ?? ""),
        ingredients: parseMgrIngredients(row[I.mtrl] ?? ""),
      });
      n++;
    }
    console.log(`${f}: ${n}행`);
  }
  return bySno;
}

async function main(): Promise<void> {
  if (!DIR) throw new Error("사용법: npx tsx scripts/ingest-10000recipe.ts <csv-디렉토리> [top개수]");

  const merged = loadMerged(DIR);
  console.log(`병합(최신 우선): ${merged.size}개`);

  const persona = [...merged.values()].filter(
    (r) =>
      EASY.has(r.dodf) &&
      r.minutes !== null &&
      r.minutes <= MAX_MINUTES &&
      r.nm.length >= 2 &&
      r.ingredients.length >= 3 &&
      r.ingredients.length <= 12 &&
      !EXCLUDE_STA.has(r.sta) &&
      !EXCLUDE_KND.has(r.knd),
  );
  console.log(`페르소나 필터 통과: ${persona.length}개`);

  // 같은 요리명은 조회수 최고(동률 시 추천수)만 — 사용자 지정 dedup 규칙
  const byDish = new Map<string, MgrRow>();
  for (const r of persona) {
    const cur = byDish.get(r.nm);
    if (!cur || r.inq > cur.inq || (r.inq === cur.inq && r.rcmm > cur.rcmm)) byDish.set(r.nm, r);
  }
  const picked = [...byDish.values()].sort((a, b) => b.inq - a.inq).slice(0, TOP);
  console.log(`요리명 dedup ${byDish.size}개 → top${TOP} 적재 (컷 조회수 ${picked[picked.length - 1]?.inq ?? "-"})`);

  let count = 0;
  for (const r of picked) {
    const data = {
      name: r.nm,
      emoji: emojiForKind(r.knd),
      minutes: r.minutes ?? MAX_MINUTES,
      servings: r.servings,
      ingredients: r.ingredients,
      steps: [] as string[], // 덤프에 조리 단계 없음 — 상세는 원문 링크(mgrSourceUrl)로
    };
    await db.recipe.upsert({
      where: { id: `${MGR_ID_PREFIX}${r.sno}` },
      create: { id: `${MGR_ID_PREFIX}${r.sno}`, rarity: "common", ...data },
      update: data,
    });
    count += 1;
    if (count % 100 === 0) console.log(`… ${count}/${picked.length}`);
  }

  // top셋 밖으로 밀려난 옛 mgr- 행 정리 — 재실행이 항상 같은 상태로 수렴하게
  const keepIds = new Set(picked.map((r) => `${MGR_ID_PREFIX}${r.sno}`));
  const existing = await db.recipe.findMany({
    where: { id: { startsWith: MGR_ID_PREFIX } },
    select: { id: true },
  });
  const stale = existing.map((e) => e.id).filter((id) => !keepIds.has(id));
  if (stale.length > 0) {
    await db.recipe.deleteMany({ where: { id: { in: stale } } });
    console.log(`옛 mgr 레시피 정리: ${stale.length}개`);
  }

  console.log(`🍳 만개의레시피 인제스트 완료: ${count}개`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
