import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { FOOD_SOURCE, searchKeyOf } from "@/features/record/foodDict";
import { portionOf } from "@/lib/portion";
import {
  MEAL_MIN_KCAL,
  MEAL_SUFFIXES,
  MIN_POPULARITY,
  NON_MEAL_CATEGORIES,
  NOT_MEAL_SUFFIXES,
  PLACE_TOP_N,
  PLAIN_RICE,
  categoriesOf,
  type OutsidePlace,
} from "@/features/record/outsidePlaces";
import type { FoodBrowseResponse, FoodSearchItem } from "@/features/record/types";

/**
 * 음식 영양 사전 — 공공 영양성분 DB에서 메뉴별 대표 1인분으로 정리한 표(scripts/ingest-mfds-food.ts).
 * - 이름 검색: 직접 입력 기록의 칼로리 제안 (음식·편의점 출처 모두)
 * - 장소별 목록: 식단 탭 '밖에서 먹기'에서 그 장소의 대표 메뉴를 가벼운 순으로
 */

const SEARCH_FIELDS = {
  id: true,
  name: true,
  category: true,
  kcal: true,
  searchKey: true,
  popularity: true,
} as const;

function find(where: Prisma.FoodNutritionWhereInput, take: number) {
  return db.foodNutrition.findMany({
    where,
    take,
    orderBy: { popularity: "desc" },
    select: SEARCH_FIELDS,
  });
}

/**
 * 마이그레이션 전에 이 코드가 먼저 배포돼도 화면이 깨지지 않게 — 표(P2021)나 컬럼(P2022)이 없으면
 * 빈 결과로 둔다. (device_tokens 때와 같은 배포 순서 대비)
 */
function isMissingSchema(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.code === "P2022")
  );
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
    if (isMissingSchema(e)) return [];
    throw e;
  }
  const [user, exact, prefix, contains] = results;

  // 같은 단계 안에서는 여러 곳에서 파는(대중적인) 메뉴 먼저, 그다음 이름이 짧은(더 구체적인) 쪽.
  const commonFirst = (
    a: { searchKey: string; popularity: number },
    b: { searchKey: string; popularity: number },
  ) => b.popularity - a.popularity || a.searchKey.length - b.searchKey.length;
  const seen = new Set<string>();
  const ordered: typeof exact = [];
  for (const row of [...exact, ...prefix.sort(commonFirst), ...contains.sort(commonFirst)]) {
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
    portion: portionOf(row.kcal), // 라벨은 숫자가 아니라 모드와 무관
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
    name: { notIn: [...PLAIN_RICE] },
    NOT: NOT_MEAL_SUFFIXES.map((s) => ({ name: { endsWith: s } })),
    AND: [
      { OR: MEAL_SUFFIXES.map((s) => ({ name: { endsWith: s } })) },
      // category NOT IN (...)만 쓰면 분류 없는(null) 가정식·급식이 SQL에서 통째로 빠진다 — null을 따로 허용.
      { OR: [{ category: null }, { category: { notIn: [...NON_MEAL_CATEGORIES] } }] },
    ],
  };
}

/**
 * 장소별 대표 메뉴 — 여러 곳에서 파는 메뉴를 많이 파는 순으로 PLACE_TOP_N개 추린 뒤 가벼운 순, 페이지.
 *
 * 처음엔 장소 안의 전부를 가벼운 순으로 줬더니 카페만 4천 개가 넘어 439쪽이 됐다 — 찾을 수도
 * 없고 한 곳에서만 파는 낯선 메뉴가 대부분이었다. '제안'은 흔한 선택지 안에서 가벼운 쪽을 짚어주는 것.
 *
 * 숫자를 숨기는(cozy) 사용자에게도 '가벼운 순' 정렬은 그대로 준다 — 경고가 아니라 제안이다.
 * kcal 숫자만 싣지 않는다(불변 #2).
 */
export async function browseFoods(
  userId: string,
  place: OutsidePlace,
  page: number,
  size: number,
): Promise<FoodBrowseResponse> {
  const where: Prisma.FoodNutritionWhereInput = {
    AND: [whereForPlace(place), { popularity: { gte: MIN_POPULARITY } }],
  };
  let results;
  try {
    results = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { displayMode: true } }),
      db.foodNutrition.findMany({
        where,
        orderBy: [{ popularity: "desc" }, { name: "asc" }],
        take: PLACE_TOP_N,
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
    if (isMissingSchema(e)) return { items: [], page, size, total: 0 };
    throw e;
  }
  const [user, rows] = results;

  const lightFirst = [...rows].sort(
    (a, b) => a.kcal - b.kcal || a.name.localeCompare(b.name, "ko"),
  );
  const detail = user?.displayMode === "detail";
  return {
    page,
    size,
    total: lightFirst.length,
    items: lightFirst.slice(page * size, page * size + size).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      kcal: detail ? row.kcal : null,
      portion: portionOf(row.kcal),
      servingAmount: row.servingAmount,
      servingUnit: row.servingUnit,
    })),
  };
}
