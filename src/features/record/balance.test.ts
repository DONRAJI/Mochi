import { describe, it, expect } from "vitest";
import { balanceNudge } from "./balance";

describe("밸런싱 넛지 (PRD 11.5 — 경고 아닌 제안)", () => {
  it("데이터가 적으면 판단하지 않고 응원한다", () => {
    expect(balanceNudge([], null).kind).toBe("cheer");
    expect(balanceNudge([500], null).kind).toBe("cheer");
  });

  it("며칠 든든했으면 가벼운 쪽을 제안한다", () => {
    const n = balanceNudge([800, 750, 900], null);
    expect(n.kind).toBe("light");
    expect(n.message).toContain("가벼운");
  });

  it("가벼운 흐름이면 그대로 응원한다", () => {
    expect(balanceNudge([300, 350, 400], null).kind).toBe("steady");
  });

  it("TDEE가 낮으면 같은 섭취도 '든든'으로 본다(개인화)", () => {
    // 한 끼 평균 500. TDEE 1200 → 예산 400*1.15=460 < 500 → light
    expect(balanceNudge([500, 520, 480], 1200).kind).toBe("light");
    // TDEE 2400 → 예산 800*1.15=920 > 500 → steady
    expect(balanceNudge([500, 520, 480], 2400).kind).toBe("steady");
  });

  it("어떤 메시지도 경고·거친 단어를 쓰지 않는다(불변 #1)", () => {
    const banned = ["실패", "오류", "경고", "초과", "그만", "안 돼"];
    const all = [
      balanceNudge([], null),
      balanceNudge([900, 900, 900], null),
      balanceNudge([300, 300], null),
    ];
    for (const n of all) for (const w of banned) expect(n.message.includes(w)).toBe(false);
  });
});
