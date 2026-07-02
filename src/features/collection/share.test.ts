import { describe, it, expect } from "vitest";
import { buildShareText } from "./share";

describe("도감 공유 텍스트 (PRD 7.3#7)", () => {
  it("모은 개수와 URL을 담는다", () => {
    const t = buildShareText("요리", 12, "https://mochi.app");
    expect(t).toContain("요리 도감을 12개");
    expect(t).toContain("https://mochi.app");
  });

  it("0개면 시작 문구", () => {
    expect(buildShareText("재료", 0, "u")).toContain("모으기 시작");
  });
});
