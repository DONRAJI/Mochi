import { describe, it, expect } from "vitest";
import {
  buildFoodEntries,
  parseAmount,
  servingKcal,
  splitFoodName,
  MAX_SERVING_KCAL,
  type NutriRow,
} from "./foodDict";

const row = (
  foodCd: string,
  foodNm: string,
  enerc: string,
  base: string,
  size: string,
  method: string,
): NutriRow => ({ foodCd, foodNm, enerc, nutConSrtrQua: base, foodSize: size, dataProdNm: method });

// 실제 API 응답 그대로(2026-09, 전국통합식품영양성분정보 표준데이터 typeNm=음식)
const kimchiStew = [
  row("D606-266000000-0001", "김치찌개", "19", "100ml", "200ml", "산출"),
  row("D306-266000000-0001", "김치찌개", "61", "100g", "400g", "분석"),
  row("D406-266000000-0001", "김치찌개", "19", "100ml", "200ml", "산출"),
  row("D506-266000000-0001", "김치찌개", "19", "100ml", "200ml", "산출"),
  row("D706-266000000-0001", "김치찌개", "19", "100ml", "200ml", "산출"),
];

const bibimbap = [
  row("D601-018000000-0001", "비빔밥", "171", "100ml", "370.80ml", "산출"),
  row("D401-018000000-0001", "비빔밥", "133", "100ml", "530ml", "산출"),
  row("D501-018000000-0001", "비빔밥", "204", "100ml", "222.48ml", "산출"),
  row("D701-018000000-0001", "비빔밥", "112", "100ml", "545.20ml", "산출"),
  row("D101-018000000-0001", "비빔밥", "142", "100g", "450g", "분석"),
  row("D301-018000000-0002", "비빔밥", "142", "100g", "100g", "분석"),
];

// 브랜드 7곳(블루샥·토프레소·이디야·컴포즈·요거프레소·엔제리너스·할리스)
const americano = [
  row("D220-748080000-0074", "커피_아메리카노 핫(HOT)", "4", "100ml", "473ml", "수집"),
  row("D220-748000000-0302", "커피_아메리카노 핫(HOT)", "1", "100g", "385g", "수집"),
  row("D220-748000000-0300", "커피_아메리카노 핫(HOT)", "2", "100g", "414g", "수집"),
  row("D220-748080000-0003", "커피_아메리카노 핫(HOT)", "3", "100ml", "591ml", "수집"),
  row("D220-748000000-0299", "커피_아메리카노 핫(HOT)", "0", "100g", "360g", "수집"),
  row("D220-748000000-0298", "커피_아메리카노 핫(HOT)", "4", "100g", "400g", "수집"),
  row("D220-748080000-0069", "커피_아메리카노 핫(HOT)", "3", "100ml", "354ml", "수집"),
];

// 수치는 실제 행(국민반반 피자), 코드는 예시
const pizzas = [
  row("PIZZA-L", "피자_국민반반 피자 (L)", "235", "100g", "889.64g", "수집"),
  row("PIZZA-R", "피자_국민반반 (R)", "219", "100g", "545g", "수집"),
];

const byName = (rows: NutriRow[], name: string) =>
  buildFoodEntries(rows).find((e) => e.name === name);

describe("양·단위 읽기", () => {
  it("소수점·괄호·리터를 읽는다", () => {
    expect(parseAmount("370.80ml")).toEqual({ value: 370.8, unit: "ml" });
    expect(parseAmount("100g(ml)")).toEqual({ value: 100, unit: "g" });
    expect(parseAmount("1.5L")).toEqual({ value: 1500, unit: "ml" });
    expect(parseAmount("")).toBeNull();
  });

  it("1인분 kcal = 기준량당 에너지 × 1회 제공량 ÷ 기준량", () => {
    expect(servingKcal(bibimbap[4])).toBe(639);
  });

  it("단위가 다르거나 값이 비면 계산하지 않는다 — 빈 에너지를 0kcal로 읽지 않음", () => {
    expect(servingKcal({ enerc: "50", nutConSrtrQua: "100g", foodSize: "200ml" })).toBeNull();
    expect(servingKcal({ enerc: "", nutConSrtrQua: "100g", foodSize: "200g" })).toBeNull();
  });

  it("'분류_메뉴명' 이름을 나눈다", () => {
    expect(splitFoodName("커피_아메리카노 핫(HOT)")).toEqual({
      category: "커피",
      name: "아메리카노 핫(HOT)",
    });
    expect(splitFoodName("김치찌개")).toEqual({ category: null, name: "김치찌개" });
  });
});

describe("이름별 대표 1인분 정하기", () => {
  it("급식 산출값이 수로 많아도 분석값이 대표 — 김치찌개 38이 아니라 244kcal", () => {
    const e = byName(kimchiStew, "김치찌개");
    expect(e).toMatchObject({ kcal: 244, servingAmount: 400, servingUnit: "g", method: "분석" });
    expect(e?.variantCount).toBe(5);
  });

  it("기준량(100g)만 적힌 행은 1인분이 아니다 — 비빔밥 142가 아니라 639kcal", () => {
    expect(byName(bibimbap, "비빔밥")).toMatchObject({
      kcal: 639,
      servingAmount: 450,
      id: "mfds-D101-018000000-0001",
    });
  });

  it("같은 층 안에선 중앙값, 0kcal도 실제 값으로 센다 — 아메리카노 11kcal", () => {
    expect(byName(americano, "아메리카노 핫(HOT)")).toMatchObject({
      kcal: 11,
      category: "커피",
      servingAmount: 354,
      servingUnit: "ml",
      id: "mfds-D220-748080000-0069",
      variantCount: 7,
    });
  });

  it(`1인분 ${MAX_SERVING_KCAL}kcal 넘는 '한 판' 크기는 사전에서 뺀다`, () => {
    const entries = buildFoodEntries(pizzas);
    expect(entries.map((e) => e.name)).toEqual(["국민반반 (R)"]);
    expect(entries[0].kcal).toBe(1194);
  });

  it("같은 행이 두 번 와도 한 번만 센다", () => {
    expect(byName([...kimchiStew, ...kimchiStew], "김치찌개")?.variantCount).toBe(5);
  });

  it("공백이 달라도 같은 음식으로 묶는다", () => {
    const entries = buildFoodEntries([
      row("A", "샌드위치_BELT샌드위치", "250", "100g", "180g", "수집"),
      row("B", "샌드위치_BELT 샌드위치", "250", "100g", "180g", "수집"),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].variantCount).toBe(2);
  });
});
