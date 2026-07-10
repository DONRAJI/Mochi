import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  parseCsv,
  parseMgrIngredients,
  parseMgrMinutes,
  parseMgrServings,
  emojiForKind,
  dishKey,
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
  raw_mtrl: string;
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
        raw_mtrl: row[I.mtrl] ?? "",
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

  // 같은 요리는 조회수 최고(동률 시 추천수)만 — dedup 키는 동의어·어순 정규화(dishKey)로
  // "간장계란밥/간장달걀밥"처럼 표기만 다른 같은 요리까지 하나로 본다.
  const byDish = new Map<string, MgrRow>();
  for (const r of persona) {
    const key = dishKey(r.nm);
    const cur = byDish.get(key);
    if (!cur || r.inq > cur.inq || (r.inq === cur.inq && r.rcmm > cur.rcmm)) byDish.set(key, r);
  }
  const picked = [...byDish.values()].sort((a, b) => b.inq - a.inq).slice(0, TOP);
  console.log(`요리명 dedup ${byDish.size}개 → top${TOP} 적재 (컷 조회수 ${picked[picked.length - 1]?.inq ?? "-"})`);

  console.log(`재료 마스터 칼로리 데이터 로드 중...`);
  const masters = await db.ingredientMaster.findMany({ select: { name: true, aliases: true, kcal: true, category: true } });
  const kcalMap = new Map<string, { kcal: number, isSpoon: boolean }>();
  for (const m of masters) {
    if (m.kcal != null) {
      const isSpoon = m.category === "양념" || m.category === "당류" || m.category === "오일";
      kcalMap.set(m.name, { kcal: m.kcal, isSpoon });
      for (const alias of m.aliases) kcalMap.set(alias, { kcal: m.kcal, isSpoon });
    }
  }

  const ZERO_KCAL = new Set(["소금", "후추", "후춧가루", "고춧가루", "고추가루", "물", "통깨", "참깨", "깨소금", "식초", "다시마"]);

  let count = 0;
  for (const r of picked) {
    let totalKcal = 0;
    
    // r.raw_mtrl looks like: "[재료] 당면 1줌반| 당근 50g [양념] 간장 2큰술"
    const rawMatch = r.raw_mtrl; 
    const tokens = rawMatch.replace(/\[[^\]]*\]/g, "|").split("|");
    
    for (let t of tokens) {
      t = t.trim();
      if (!t) continue;
      
      const cleanName = t.replace(/\([^)]*\)/g, "").replace(/[0-9½⅓¼⅔¾][^|]*$/, "").replace(/\s*(약간|적당량|적당히|조금|취향껏|기호에\s*따라|한\s*줌|반\s*줌)$/, "").replace(/[·.,~!?*♡+\-]+$/, "").trim().replace(/\s{2,}/g, " ");
      
      if (cleanName === "") continue;
      if (ZERO_KCAL.has(cleanName) || ZERO_KCAL.has(cleanName.replace(/\s+/g, ""))) continue;

      const master = kcalMap.get(cleanName) ?? kcalMap.get(cleanName.replace(/\s+/g, ""));
      if (!master) continue;

      let amountGrams = 0;

      // Match g or ml
      const gMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:g|그램|gram|ml)/i);
      if (gMatch) amountGrams = parseFloat(gMatch[1]);
      else {
        // Match spoon
        const spoonMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:스푼|T|큰술|수저)/i);
        if (spoonMatch) {
           const s = parseFloat(spoonMatch[1]);
           if (/볼록|수북|듬뿍/.test(t)) amountGrams = s * 13.5;
           else amountGrams = s * 8.5;
        } else if (/볼록하게\s*1스푼|듬뿍\s*1스푼/.test(t)) {
           amountGrams = 13.5;
        }
      }

      if (amountGrams === 0) {
        const mCount = t.match(/(\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?/); 
        let countVal = 1;
        if (mCount) {
          if (mCount[2]) countVal = parseFloat(mCount[1]) / parseFloat(mCount[2]);
          else countVal = parseFloat(mCount[1]);
        }

        if (/(포기)/.test(t)) {
           amountGrams = countVal * 1500; // 배추 1포기 약 1.5kg
        } else if (/(모)/.test(t)) {
           amountGrams = countVal * 300; // 두부 1모 약 300g
        } else if (/(공기|그릇)/.test(t)) {
           amountGrams = countVal * 200; // 밥 1공기 약 200g
        } else if (/마리/.test(t)) {
           amountGrams = countVal * 800; // 1마리 보통 800g
        } else if (/(줌|주먹)/.test(t)) {
           amountGrams = countVal * 50; // 1줌 약 50g
        } else if (/(토막|톨)/.test(t)) {
           let baseGrams = 85; // 생선 등 평균 1토막 약 85g 
           if (/마늘|생강/.test(cleanName)) baseGrams = 5; // 1톨 = 5g
           else if (/무/.test(cleanName)) baseGrams = 150; // 1토막 = 150g
           else if (/고기|돼지|소|육|스테이크/.test(cleanName)) baseGrams = 100;
           amountGrams = countVal * baseGrams;
        } else if (/(개|뿌리|장|조각|대|덩어리|송이)/.test(t)) {
           let baseGrams = 100; 
           if (/양파/.test(cleanName)) baseGrams = 170; // 중간사이즈 170g
           else if (/당근/.test(cleanName)) baseGrams = 150; // 중간사이즈 150g
           else if (/대파/.test(cleanName) && /대/.test(t)) baseGrams = 140; // 1대 140g (1/2대 70g)
           else if (/마늘|쪽파|청양고추|고추/.test(cleanName)) baseGrams = 5;
           else if (/방울토마토|새우|메추리알|호두|아몬드|바지락|조개|홍합|굴|멸치/.test(cleanName)) baseGrams = 15;
           else if (/표고버섯|양송이|버섯/.test(cleanName)) baseGrams = 20; // 1송이/1개 = 약 20g
           else if (/계란|달걀|노른자|흰자/.test(cleanName)) baseGrams = 50;
           else if (/무|배추|수박|늙은호박|단호박/.test(cleanName)) baseGrams = 800;
           
           amountGrams = countVal * baseGrams; 
        } else if (/(적당량|약간|조금)/.test(t) && master.isSpoon) {
           if (/(기름|오일|유|식용유)$/.test(cleanName)) {
             amountGrams = 20; 
           } else {
             amountGrams = 8.5; 
           }
        } else if (master.isSpoon) {
           amountGrams = 8.5; 
        } else {
           amountGrams = 50; // 완전 생략 시 기본량 50g
        }
      }
      
      if (master.isSpoon) {
         // DB stored per 10g basis for spoons.
         totalKcal += master.kcal * (amountGrams / 10);
      } else {
         // DB stored per 100g basis.
         totalKcal += master.kcal * (amountGrams / 100);
      }
    }

    const estimatedKcal = Math.round(totalKcal / r.servings);

    const data = {
      name: r.nm,
      emoji: emojiForKind(r.knd),
      minutes: r.minutes ?? MAX_MINUTES,
      servings: r.servings,
      kcal: estimatedKcal,
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
