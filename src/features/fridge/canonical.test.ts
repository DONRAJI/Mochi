import { describe, it, expect } from "vitest";
import { buildCanonicalMap, canonicalize } from "./canonical";

describe("canonical", () => {
  const map = buildCanonicalMap([
    { name: "방울토마토", aliases: ["토마토", "대추토마토"] },
    { name: "계란", aliases: ["달걀"] },
    { name: "닭가슴살", aliases: [] },
  ]);

  it("별칭을 표준명으로 바꾼다", () => {
    expect(canonicalize("토마토", map)).toBe("방울토마토");
    expect(canonicalize("달걀", map)).toBe("계란");
  });
  it("표준명은 그대로", () => {
    expect(canonicalize("방울토마토", map)).toBe("방울토마토");
  });
  it("모르는 재료는 그대로 둔다", () => {
    expect(canonicalize("감자", map)).toBe("감자");
  });

  // 강화: 공백·손질 수식어 정규화 (코퍼스 노이즈 청소 + 냉장고 매칭 정확도)
  it("공백 편차를 하나로 합친다", () => {
    expect(canonicalize("닭 가슴살", map)).toBe("닭가슴살");
    expect(canonicalize("달 걀", map)).toBe("계란");
  });
  it("손질 수식어를 떼고 본 재료로 매칭한다", () => {
    expect(canonicalize("다진 마늘", map)).toBe("마늘");
    expect(canonicalize("삶은 계란", map)).toBe("계란"); // 수식어 제거 후 마스터 매칭까지
    expect(canonicalize("냉동 만두", map)).toBe("만두");
  });
  it("수식어를 떼면 2자 미만이 되는 고유 음식명은 보호한다", () => {
    expect(canonicalize("찐빵", map)).toBe("찐빵");
  });
});
