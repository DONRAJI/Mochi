import { describe, it, expect } from "vitest";
import { deliverySearchUrl } from "./delivery";

describe("배달 검색 연결 (PRD 8-1)", () => {
  it("메뉴명을 배달 검색 URL로 인코딩한다", () => {
    const url = deliverySearchUrl("닭가슴살 샐러드");
    expect(url).toContain("search.naver.com");
    expect(url).toContain(encodeURIComponent("닭가슴살 샐러드 배달"));
  });
});
