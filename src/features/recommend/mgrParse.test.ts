import { describe, it, expect } from "vitest";
import {
  parseCsv,
  parseMgrIngredients,
  parseMgrMinutes,
  parseMgrServings,
  mgrSourceUrl,
} from "./mgrParse";

describe("mgrParse — CSV", () => {
  it("따옴표 필드 안의 콤마·이스케이프·줄바꿈을 처리한다", () => {
    const rows = parseCsv('a,"b,c","d""e"\n1,"두\n줄",3\n');
    expect(rows[0]).toEqual(["a", "b,c", 'd"e']);
    expect(rows[1]).toEqual(["1", "두\n줄", "3"]);
  });
  it("CRLF 줄끝을 처리한다", () => {
    const rows = parseCsv("a,b\r\nc,d\r\n");
    expect(rows[0]).toEqual(["a", "b"]);
    expect(rows[1]).toEqual(["c", "d"]);
  });
});

describe("mgrParse — 재료", () => {
  it("섹션 라벨·수량·괄호 주석을 제거하고 재료명만 남긴다", () => {
    const raw =
      "[재료] 당면 1줌반| 소고기(국거리용)| (집)국간장 4T| 멸치육수(쌀뜨물가능) 적당량 [양념] 간장 10큰술| 통깨 약간";
    expect(parseMgrIngredients(raw)).toEqual([
      "당면",
      "소고기",
      "국간장",
      "멸치육수",
      "간장",
      "통깨",
    ]);
  });
  it("분수·단위 붙은 수량과 중복을 제거한다", () => {
    const raw = "[재료] 양파 1/2개| 떡국떡400g| 고추장 2T| 양파 1개| 대파1/3대";
    expect(parseMgrIngredients(raw)).toEqual(["양파", "떡국떡", "고추장", "대파"]);
  });
  it("빈 토큰·과도하게 긴 토큰은 버린다", () => {
    const raw = "[재료] | 계란 2개| 이건 재료가 아니라 아주 긴 설명 문장이라서 버려야 함 1개";
    expect(parseMgrIngredients(raw)).toEqual(["계란"]);
  });
});

describe("mgrParse — 메타", () => {
  it("조리시간 표기를 분으로 바꾼다", () => {
    expect(parseMgrMinutes("30분이내")).toBe(30);
    expect(parseMgrMinutes("5분이내")).toBe(5);
    expect(parseMgrMinutes("2시간이상")).toBe(120);
    expect(parseMgrMinutes("")).toBeNull();
  });
  it("인분 표기를 숫자로 바꾼다 (빈값은 2)", () => {
    expect(parseMgrServings("2인분")).toBe(2);
    expect(parseMgrServings("6인분이상")).toBe(6);
    expect(parseMgrServings("")).toBe(2);
  });
  it("mgr id에서 원문 링크를 만들고, 다른 id는 null", () => {
    expect(mgrSourceUrl("mgr-6889186")).toBe("https://www.10000recipe.com/recipe/6889186");
    expect(mgrSourceUrl("cookrcp-123")).toBeNull();
    expect(mgrSourceUrl("seed-recipe-egg")).toBeNull();
  });
});
