import { describe, it, expect } from "vitest";
import {
  pickExpiringIngredient,
  reminderMessage,
  REMINDER_POOL,
  type ReminderContext,
} from "./reminder";

const base: ReminderContext = {
  plannedDinner: null,
  expiringIngredient: null,
  canDraw: false,
  dayNumber: 20_000,
  userKey: "user-a",
};

/** messages.test.ts와 같은 금지어 — 알림도 죄책감 제로(불변 #1) */
const BANNED = ["실패", "오류", "에러", "경고", "잘못", "❌", "금지", "초과"];

describe("저녁 리마인더 문구", () => {
  it("오늘 저녁으로 담아둔 계획이 있으면 그걸 가장 먼저", () => {
    const m = reminderMessage({ ...base, plannedDinner: "두부조림", canDraw: true });
    expect(m.body).toContain("두부조림");
    expect(m.url).toBe("/meals?view=week");
  });

  it("긴 이름은 줄인다", () => {
    const m = reminderMessage({ ...base, plannedDinner: "가".repeat(40) });
    expect(m.body).toContain("…");
  });

  it("같은 사람도 날마다, 같은 날도 사람마다 문구가 달라진다", () => {
    const days = new Set(
      Array.from(
        { length: 10 },
        (_, i) => reminderMessage({ ...base, dayNumber: 20_000 + i }).body,
      ),
    );
    expect(days.size).toBeGreaterThan(1);
    const users = new Set(
      ["a", "b", "c", "d", "e", "f"].map((u) => reminderMessage({ ...base, userKey: u }).body),
    );
    expect(users.size).toBeGreaterThan(1);
  });

  it("유통기한 재료·뽑기 신호도 돌아가며 나온다", () => {
    const bodies = new Set(
      Array.from(
        { length: 30 },
        (_, i) =>
          reminderMessage({
            ...base,
            dayNumber: 20_000 + i,
            expiringIngredient: "두부",
            canDraw: true,
          }).body,
      ),
    );
    expect([...bodies].some((b) => b.includes("두부"))).toBe(true);
    expect([...bodies].some((b) => b.includes("씨앗"))).toBe(true);
  });

  it("문구에 금지어·숫자(칼로리·체중)가 없다", () => {
    const all = [
      ...REMINDER_POOL.map((m) => m.body),
      reminderMessage({ ...base, plannedDinner: "두부조림" }).body,
      ...Array.from(
        { length: 30 },
        (_, i) =>
          reminderMessage({ ...base, dayNumber: i, expiringIngredient: "두부", canDraw: true })
            .body,
      ),
    ];
    for (const body of all) {
      for (const w of BANNED) expect(body).not.toContain(w);
      expect(body).not.toMatch(/\d/);
    }
  });
});

describe("유통기한 재료 고르기", () => {
  const now = new Date("2026-09-17T18:30:00+09:00");
  const at = (h: number) => new Date(now.getTime() + h * 3_600_000);

  it("오늘·내일 중 가장 급한 것, 지난 건 권하지 않는다", () => {
    expect(
      pickExpiringIngredient(
        [
          { name: "지난우유", expiresAt: at(-30) },
          { name: "두부", expiresAt: at(20) },
          { name: "계란", expiresAt: at(5) },
          { name: "양파", expiresAt: at(24 * 5) },
          { name: "소금", expiresAt: null },
        ],
        now,
      ),
    ).toBe("계란");
    expect(pickExpiringIngredient([{ name: "양파", expiresAt: at(24 * 5) }], now)).toBeNull();
  });
});
