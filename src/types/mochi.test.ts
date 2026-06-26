import { describe, it, expect } from "vitest";
import { MOCHI_STATES, isMochiState } from "./mochi";

/** 불변 #3: 모찌 상태 유니온 고정 — 정확히 이 4개만 유효해야 한다. */
describe("MochiState", () => {
  it("정확히 happy/sleepy/idle/cheer 4개다", () => {
    expect([...MOCHI_STATES]).toEqual(["happy", "sleepy", "idle", "cheer"]);
  });

  it("정의된 상태만 통과시킨다", () => {
    expect(isMochiState("happy")).toBe(true);
    expect(isMochiState("angry")).toBe(false);
    expect(isMochiState("")).toBe(false);
  });
});
