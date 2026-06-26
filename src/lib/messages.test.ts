import { describe, it, expect } from "vitest";
import { messages } from "./messages";

/**
 * 제품 불변 규칙 #1(죄책감 제로)을 테스트로 강제한다.
 * 모든 카피 문자열에 금지어가 없어야 한다. messages.ts에 거친 단어가 들어오면 CI에서 깨진다.
 */
const BANNED = ["실패", "오류", "에러", "경고", "잘못", "❌", "금지", "초과"];

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") acc.push(value);
  else if (typeof value === "function") acc.push(String(value("샘플")));
  else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectStrings(v, acc);
  }
  return acc;
}

describe("모찌 보이스 카피 (불변 #1: 죄책감 제로)", () => {
  const all = collectStrings(messages);

  it("수집된 카피가 비어 있지 않다", () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it.each(BANNED)("금지어 '%s' 를 포함하지 않는다", (word) => {
    const offenders = all.filter((s) => s.includes(word));
    expect(offenders).toEqual([]);
  });
});
