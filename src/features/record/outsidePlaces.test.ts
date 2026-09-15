import { describe, it, expect } from "vitest";
import {
  placeOf,
  categoriesOf,
  NON_MEAL_CATEGORIES,
  MEAL_MIN_KCAL,
  OUTSIDE_PLACES,
} from "./outsidePlaces";
import { foodBrowseQuerySchema } from "./types";

const e = (name: string, category: string | null, kcal: number) => ({ name, category, kcal });

describe("밖에서 먹기 — 장소 분류", () => {
  it("카페 음료 (특수문자 들어간 분류명 포함)", () => {
    expect(placeOf(e("아메리카노 핫(HOT)", "커피", 11))).toBe("cafe");
    expect(placeOf(e("딸기 스무디", "스무디", 415))).toBe("cafe");
    expect(placeOf(e("오렌지 주스", "과ㆍ채주스", 175))).toBe("cafe");
    expect(placeOf(e("타로 버블티", "밀크티/버블티", 331))).toBe("cafe");
  });

  it("빵집·디저트", () => {
    expect(placeOf(e("플레인 크로플", "크로플", 317))).toBe("bakery");
    expect(placeOf(e("햄치즈샌드위치", "샌드위치", 437))).toBe("bakery");
  });

  it("버거·치킨", () => {
    expect(placeOf(e("불고기버거", "버거", 559))).toBe("fastfood");
    expect(placeOf(e("후라이드 치킨 한 조각", "닭튀김", 289))).toBe("fastfood");
  });

  it("피자는 어디에도 넣지 않는다 — 한 판 단위라 조각 기준이 없다", () => {
    expect(placeOf(e("국민반반 (R)", "피자", 1194))).toBeNull();
  });

  it("식사 한 끼 = 이름 끝말 + 최소 kcal (분류 없는 가정식·급식도)", () => {
    expect(placeOf(e("김치찌개", null, 244))).toBe("meal");
    expect(placeOf(e("비빔밥", null, 639))).toBe("meal");
    expect(placeOf(e("새우볶음밥", "볶음밥", 520))).toBe("meal");
    expect(placeOf(e("토마토 스파게티", "스파게티", 600))).toBe("meal");
  });

  it(`곁들이는 한 끼가 아니다 — ${MEAL_MIN_KCAL}kcal 미만 국·나물`, () => {
    expect(placeOf(e("된장국", null, 80))).toBeNull();
    expect(placeOf(e("콩나물무침", null, 40))).toBeNull();
  });

  it("카페·빵집 분류면 이름이 '밥'으로 끝나도 식사가 아니다 — 서버 조회와 같은 규칙", () => {
    expect(placeOf(e("찰떡밥", "찹쌀떡", 300))).toBe("bakery");
    for (const c of [...categoriesOf("cafe"), ...categoriesOf("bakery"), ...categoriesOf("fastfood"), "피자"]) {
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
