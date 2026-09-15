import { describe, it, expect } from "vitest";
import { pageCount, clampPage, pageSlice, RECIPE_PAGE_SIZE } from "./paging";

const items = Array.from({ length: 50 }, (_, i) => i);

describe("추천 목록 페이지 나누기", () => {
  it("50장을 6장씩 나누면 9페이지다", () => {
    expect(RECIPE_PAGE_SIZE).toBe(6);
    expect(pageCount(50)).toBe(9);
  });

  it("비어 있어도 1페이지로 친다 — '1 / 0' 같은 상태를 만들지 않는다", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageSlice([], 0)).toEqual([]);
  });

  it("각 페이지는 순서대로 겹치지 않게 잘린다", () => {
    expect(pageSlice(items, 0)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(pageSlice(items, 1)).toEqual([6, 7, 8, 9, 10, 11]);
  });

  it("마지막 페이지는 남은 만큼만", () => {
    expect(pageSlice(items, 8)).toEqual([48, 49]);
  });

  it("목록이 줄어 보던 페이지가 사라지면 마지막 페이지로 붙는다(빈 화면 방지)", () => {
    expect(clampPage(8, 10)).toBe(1);
    expect(pageSlice(items.slice(0, 10), 8)).toEqual([6, 7, 8, 9]);
  });

  it("음수 페이지는 첫 페이지로", () => {
    expect(clampPage(-3, 50)).toBe(0);
  });
});
