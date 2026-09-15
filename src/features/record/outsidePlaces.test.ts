import { describe, it, expect } from "vitest";
import {
  placeOf,
  categoriesOf,
  NON_MEAL_CATEGORIES,
  MEAL_MIN_KCAL,
  OUTSIDE_PLACES,
} from "./outsidePlaces";
import { FOOD_SOURCE } from "./foodDict";
import { foodBrowseQuerySchema } from "./types";

const dish = (name: string, category: string | null, kcal: number) => ({
  name,
  category,
  kcal,
  source: FOOD_SOURCE.dish,
});
const convenience = (name: string, category: string, kcal: number) => ({
  name,
  category,
  kcal,
  source: FOOD_SOURCE.convenience,
});

describe("밖에서 먹기 — 장소 분류", () => {
  it("카페 음료 (특수문자 들어간 분류명 포함)", () => {
    expect(placeOf(dish("아메리카노 핫(HOT)", "커피", 11))).toBe("cafe");
    expect(placeOf(dish("딸기 스무디", "스무디", 415))).toBe("cafe");
    expect(placeOf(dish("오렌지 주스", "과ㆍ채주스", 175))).toBe("cafe");
    expect(placeOf(dish("타로 버블티", "밀크티/버블티", 331))).toBe("cafe");
  });

  it("빵집·디저트", () => {
    expect(placeOf(dish("플레인 크로플", "크로플", 317))).toBe("bakery");
    expect(placeOf(dish("햄치즈샌드위치", "샌드위치", 437))).toBe("bakery");
  });

  it("버거·치킨", () => {
    expect(placeOf(dish("불고기버거", "버거", 559))).toBe("fastfood");
    expect(placeOf(dish("후라이드 치킨 한 조각", "닭튀김", 289))).toBe("fastfood");
  });

  it("피자는 어디에도 넣지 않는다 — 한 판 단위라 조각 기준이 없다", () => {
    expect(placeOf(dish("국민반반 (R)", "피자", 1194))).toBeNull();
  });

  it("식사 한 끼 = 이름 끝말 + 최소 kcal (분류 없는 가정식·급식도)", () => {
    expect(placeOf(dish("김치찌개", null, 244))).toBe("meal");
    expect(placeOf(dish("비빔밥", null, 639))).toBe("meal");
    expect(placeOf(dish("새우볶음밥", "볶음밥", 520))).toBe("meal");
    expect(placeOf(dish("토마토 스파게티", "스파게티", 600))).toBe("meal");
  });

  it(`곁들이는 한 끼가 아니다 — ${MEAL_MIN_KCAL}kcal 미만 국·나물`, () => {
    expect(placeOf(dish("된장국", null, 80))).toBeNull();
    expect(placeOf(dish("콩나물무침", null, 40))).toBeNull();
  });

  it("편의점은 출처로 나뉜다 — 같은 '샌드위치' 분류라도 편의점 상품이면 편의점", () => {
    expect(placeOf(convenience("참치샐러드듬뿍샌드위치", "샌드위치", 430))).toBe("convenience");
    // 편의점 김밥·도시락은 이름이 '밥'으로 끝나고 kcal이 커도 '식사 한 끼'로 섞이지 않는다
    expect(placeOf(convenience("참치마요김밥", "주먹밥/김밥/초밥", 370))).toBe("convenience");
  });

  it("알 수 없는 출처는 어느 장소에도 넣지 않는다", () => {
    expect(placeOf({ name: "비빔밥", category: null, kcal: 639, source: "other" })).toBeNull();
  });

  it("카페·빵집 분류면 이름이 '밥'으로 끝나도 식사가 아니다 — 서버 조회와 같은 규칙", () => {
    expect(placeOf(dish("찰떡밥", "찹쌀떡", 300))).toBe("bakery");
    for (const c of [
      ...categoriesOf("cafe"),
      ...categoriesOf("bakery"),
      ...categoriesOf("fastfood"),
      "피자",
    ]) {
      expect(NON_MEAL_CATEGORIES).toContain(c);
    }
  });

  it("분류 목록끼리 겹치지 않는다 — 한 항목은 한 장소에만", () => {
    const all = [...categoriesOf("cafe"), ...categoriesOf("bakery"), ...categoriesOf("fastfood")];
    expect(new Set(all).size).toBe(all.length);
  });

  it("장소 조회 쿼리가 받는 값이 장소 목록과 같다", () => {
    for (const place of OUTSIDE_PLACES) {
      expect(foodBrowseQuerySchema.safeParse({ place }).success).toBe(true);
    }
    expect(foodBrowseQuerySchema.safeParse({ place: "pizza" }).success).toBe(false);
  });
});
