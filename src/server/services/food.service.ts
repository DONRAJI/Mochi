import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { FOOD_SOURCE, searchKeyOf } from "@/features/record/foodDict";
import {
  MEAL_MIN_KCAL,
  MEAL_SUFFIXES,
  NON_MEAL_CATEGORIES,
  categoriesOf,
  type OutsidePlace,
} from "@/features/record/outsidePlaces";
import type { FoodBrowseResponse, FoodSearchItem } from "@/features/record/types";

/**
 * 음식 영양 사전 — 공공 영양성분 DB에서 이름별 대표 1인분으로 정리한 표(scripts/ingest-mfds-food.ts).
 * - 이름 검색: 직접 입력 기록의 칼로리 제안 (음식·편의점 출처 모두)
 * - 장소별 목록: 식단 탭 '밖에서 먹기'에서 그 장소의 가벼운 선택 순서
 */

const SEARCH_FIELDS = { id: true, name: true, category: true, kcal: true, searchKey: true } as const;

function find(where: Prisma.FoodNutritionWhereInput, take: number) {
  return db.foodNutrition.findMany({ where, take, select: SEARCH_FIELDS });
}

/**
 * 마이그레이션 전에 이 코드가 먼저 배포돼도 화면이 깨지지 않게 — 표가 없으면 빈 결과로 둔다.
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

/** 장소 → 조회 조건. outsidePlaces.placeOf와 같은 규칙이어야 한다(그 모듈의 목록을 그대로 쓴다). */
function whereForPlace(place: OutsidePlace): Prisma.FoodNutritionWhereInput {
  // 출처로 먼저 나눈다 — 카페 샌드위치(음식)와 편의점 샌드위치(가공식품)가 같은 분류명을 쓴다.
  if (place === "convenience") return { source: FOOD_SOURCE.convenience };
  if (place !== "meal") {
    return { source: FOOD_SOURCE.dish, category: { in: [...categoriesOf(place)] } };
  }
  return {
    source: FOOD_SOURCE.dish,
    kcal: { gte: MEAL_MIN_KCAL },
    AND: [
      { OR: MEAL_SUFFIXES.map((s) => ({ name: { endsWith: s } })) },
      // category NOT IN (...)만 쓰면 분류 없는(null) 가정식·급식이 SQL에서 통째로 빠진다 — null을 따로 허용.
      { OR: [{ category: null }, { category: { notIn: [...NON_MEAL_CATEGORIES] } }] },
    ],
  };
}

/**
 * 장소별 음식 목록 — 가벼운 순(kcal 오름차순), 페이지.
 * 숫자를 숨기는(cozy) 사용자에게도 '가벼운 순' 정렬은 그대로 준다 — 경고가 아니라 제안이다.
 * kcal 숫자만 싣지 않는다(불변 #2).
 */
export async function browseFoods(
  userId: string,
  place: OutsidePlace,
  page: number,
  size: number,
): Promise<FoodBrowseResponse> {
  const where = whereForPlace(place);
  let results;
  try {
    results = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { displayMode: true } }),
      db.foodNutrition.count({ where }),
      db.foodNutrition.findMany({
        where,
        orderBy: [{ kcal: "asc" }, { name: "asc" }],
        skip: page * size,
        take: size,
        select: {
          id: true,
          name: true,
          category: true,
          kcal: true,
          servingAmount: true,
          servingUnit: true,
        },
      }),
    ]);
  } catch (e) {
    if (isMissingTable(e)) return { items: [], page, size, total: 0 };
    throw e;
  }
  const [user, total, rows] = results;

  const detail = user?.displayMode === "detail";
  return {
    page,
    size,
    total,
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      kcal: detail ? row.kcal : null,
      servingAmount: row.servingAmount,
      servingUnit: row.servingUnit,
    })),
  };
}
