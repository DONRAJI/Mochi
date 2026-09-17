import { describe, it, expect } from "vitest";
import { streakNote } from "./growth";

describe("연속 기록 보조 문구", () => {
  it("끊겨서 1일(또는 첫 기록)일 땐 아무것도 안 보인다", () => {
    expect(streakNote(0, 1)).toBeNull();
    expect(streakNote(1, 1)).toBeNull();
  });

  it("이어가는 동안만 살짝 칭찬, 보호권이 있으면 함께", () => {
    expect(streakNote(3, 0)).toBe("🍮 3일째 이어가는 중");
    expect(streakNote(8, 2)).toBe("🍮 8일째 이어가는 중 · 🛡️ 2");
  });
});
