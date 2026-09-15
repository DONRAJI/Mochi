import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { searchKeyOf } from "@/features/record/foodDict";
import type { FoodSearchItem } from "@/features/record/types";

/**
 * 음식 영양 사전 검색 — 직접 입력 기록에서 이름으로 칼로리 후보를 찾는다.
 * 사전은 공공 영양성분 DB에서 이름별 대표 1인분으로 정리한 표(scripts/ingest-mfds-food.ts).
 */

const FIELDS = { id: true, name: true, category: true, kcal: true, searchKey: true } as const;

function find(where: Prisma.FoodNutritionWhereInput, take: number) {
  return db.foodNutrition.findMany({ where, take, select: FIELDS });
}

/**
 * 마이그레이션 전에 이 코드가 먼저 배포돼도 기록 화면이 깨지지 않게 — 표가 없으면 제안만 비운다.
 * (device_tokens 때와 같은 배포 순서 대비)
 */
function isMissingTable(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021";
}

export async function searchFoods(
  userId: string,
  q: string,
  size: number,
): Promise<FoodSearchItem[]> {
  const key = searchKeyOf(q);
  if (key.length < 2) return [];

  // '포함'만으로 앞에서 몇 개 자르면 "라떼"를 쳤는데 "라떼"가 안 나올 수 있다(수백 개가 걸림).
  // 정확히 같음 → 앞부분 일치 → 포함 순으로 따로 받아 합친다. 기록 화면의 카탈로그 매칭과 같은 순서.
  let results;
  try {
    results = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { displayMode: true } }),
      find({ searchKey: key }, size),
      find({ searchKey: { startsWith: key } }, 30),
      find({ searchKey: { contains: key } }, 30),
    ]);
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
  const [user, exact, prefix, contains] = results;

  // 같은 단계 안에서는 이름이 짧은(= 더 구체적인) 쪽이 먼저.
  const shorterFirst = (a: { searchKey: string }, b: { searchKey: string }) =>
    a.searchKey.length - b.searchKey.length;
  const seen = new Set<string>();
  const ordered: typeof exact = [];
  for (const row of [...exact, ...prefix.sort(shorterFirst), ...contains.sort(shorterFirst)]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    ordered.push(row);
    if (ordered.length >= size) break;
  }

  const detail = user?.displayMode === "detail";
  return ordered.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    kcal: detail ? row.kcal : null, // cozy 사용자에겐 숫자를 싣지 않는다 (불변 #2)
  }));
}
