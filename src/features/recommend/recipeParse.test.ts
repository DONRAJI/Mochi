import { describe, it, expect } from "vitest";
import { parseIngredientNames, cleanSteps, estimateMinutes } from "./recipeParse";

describe("recipeParse", () => {
  it("재료 텍스트에서 이름만 추출한다", () => {
    const raw =
      "새우두부계란찜\n연두부 75g(3/4모), 칵테일새우 20g(5마리), 달걀 30g(1/2개)\n고명\n시금치 10g(3줄기)";
    const r = parseIngredientNames(raw, "새우두부계란찜");
    expect(r).toContain("연두부");
    expect(r).toContain("달걀");
    expect(r).toContain("시금치");
    expect(r).not.toContain("고명"); // 헤더 제외
    expect(r).not.toContain("새우두부계란찜"); // 요리명 제외
  });

  it("● 섹션 마커·헤더를 제거한다", () => {
    const raw = "●주재료 : 소면 100g, 저염소금 1g\n●장식 : 잣 5g, 오이 10g";
    const r = parseIngredientNames(raw);
    expect(r).toEqual(expect.arrayContaining(["소면", "저염소금", "잣", "오이"]));
    expect(r.some((n) => n.includes("주재료") || n.includes("●") || n.includes(":"))).toBe(false);
  });

  it("조리단계의 번호·끝 잉여문자를 제거한다", () => {
    expect(cleanSteps(["1. 새우를 데친다.a", "", "2. 섞는다.b"])).toEqual([
      "새우를 데친다.",
      "섞는다.",
    ]);
  });

  it("단계 수로 시간을 추정한다(10~60 클램프)", () => {
    expect(estimateMinutes(3)).toBe(15);
    expect(estimateMinutes(0)).toBe(10);
    expect(estimateMinutes(20)).toBe(60);
  });
});
