import { describe, it, expect } from "vitest";
import { buildCanonicalMap, canonicalize } from "./canonical";

describe("canonical", () => {
  const map = buildCanonicalMap([
    { name: "방울토마토", aliases: ["토마토", "대추토마토"] },
    { name: "계란", aliases: ["달걀"] },
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
});
