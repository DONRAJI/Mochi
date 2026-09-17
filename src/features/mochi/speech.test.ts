import { describe, it, expect } from "vitest";
import { ALL_SPEECH_LINES, GOOD_DAY_MILESTONES, mochiSpeech, type SpeechContext } from "./speech";

const base: SpeechContext = {
  state: "idle",
  hour: 12,
  weekday: 3, // 수요일
  dayNumber: 20_000,
  goodDays: 5,
  canDraw: false,
};

/** messages.test.ts와 같은 금지어 + 지적·재촉하는 말 (불변 #1) */
const BANNED = [
  "실패",
  "오류",
  "에러",
  "경고",
  "잘못",
  "❌",
  "금지",
  "초과",
  "아직 안",
  "해야",
  "빨리",
];

describe("모찌 말풍선", () => {
  it("같은 날·같은 시간대엔 같은 말 — 새로고침마다 바뀌지 않는다", () => {
    expect(mochiSpeech({ ...base, hour: 11 })).toBe(mochiSpeech({ ...base, hour: 13 }));
  });

  it("날이 바뀌면 달라진다", () => {
    const lines = new Set(
      Array.from({ length: 12 }, (_, i) => mochiSpeech({ ...base, dayNumber: 20_000 + i })),
    );
    expect(lines.size).toBeGreaterThan(1);
  });

  it("시간대에 맞는 말 — 아침엔 아침, 저녁엔 저녁", () => {
    expect(mochiSpeech({ ...base, hour: 8, dayNumber: 0 })).toMatch(/아침|일어났어요/);
    expect(mochiSpeech({ ...base, hour: 19, dayNumber: 0 })).toMatch(/저녁|수고|냉장고/);
  });

  it("오늘 먹었으면 칭찬, 밤이면 쉬어가기", () => {
    expect(mochiSpeech({ ...base, state: "happy" })).toMatch(/잘|고마워요|기뻐요/);
    expect(mochiSpeech({ ...base, state: "sleepy", goodDays: 7 })).toMatch(/쉬어|자요|꿈나라/);
  });

  it("잘 먹은 날 이정표엔 그날 하루 축하", () => {
    for (const n of GOOD_DAY_MILESTONES) {
      expect(mochiSpeech({ ...base, goodDays: n })).toContain(`${n}일`);
    }
    expect(mochiSpeech({ ...base, goodDays: 8 })).not.toContain("8일");
  });

  it("씨앗이 모이면 가끔 뽑기를 권한다 (매번은 아님)", () => {
    const lines = Array.from({ length: 12 }, (_, i) =>
      mochiSpeech({ ...base, canDraw: true, dayNumber: 20_000 + i }),
    );
    expect(lines.some((l) => l.includes("씨앗"))).toBe(true);
    expect(lines.every((l) => l.includes("씨앗"))).toBe(false);
  });

  it("문구에 금지어·지적하는 말·숫자가 없다", () => {
    for (const line of ALL_SPEECH_LINES) {
      for (const w of BANNED) expect(line).not.toContain(w);
      expect(line).not.toMatch(/\d/);
    }
  });
});
