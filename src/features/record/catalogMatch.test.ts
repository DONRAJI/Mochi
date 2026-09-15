import { describe, it, expect } from "vitest";
import { matchCatalog, normalizeName, type CatalogCandidate } from "./catalogMatch";

const item = (
  id: string,
  name: string,
  mode: CatalogCandidate["mode"] = "convenience",
): CatalogCandidate => ({ id, name, mode, emoji: null, subtitle: null, kcal: null });

const catalog: CatalogCandidate[] = [
  item("c-tuna", "참치마요 삼각김밥"),
  item("c-bibim", "전주비빔 삼각김밥"),
  item("c-spam", "스팸마요 삼각김밥"),
  item("c-yogurt", "그릭요거트"),
  item("c-salad", "닭가슴살 샐러드 도시락"),
  item("m-salad", "닭가슴살 샐러드", "eatout"),
  item("m-sundubu", "순두부찌개 한 상", "eatout"),
  item("m-seafood", "해물 순두부", "eatout"),
  item("m-pho", "쌀국수", "eatout"),
  item("m-bibimbap", "비빔밥", "eatout"),
];

const ids = (q: string) => matchCatalog(q, catalog).map((c) => c.id);

describe("직접 입력 이름 → 카탈로그 매칭", () => {
  it("공백·대소문자를 무시한다", () => {
    expect(normalizeName(" GS25 참치 마요 ")).toBe("gs25참치마요");
    expect(ids("참치 마요")).toEqual(["c-tuna"]);
    expect(ids("그릭 요거트")).toEqual(["c-yogurt"]);
  });

  it("한 글자는 제안하지 않는다 — 너무 많이 걸린다", () => {
    expect(ids("밥")).toEqual([]);
    expect(ids("")).toEqual([]);
  });

  it("정확히 같은 이름이 가장 먼저", () => {
    expect(ids("비빔밥")[0]).toBe("m-bibimbap");
  });

  it("앞부분 일치가 중간 포함보다 먼저", () => {
    expect(ids("순두부")).toEqual(["m-sundubu", "m-seafood"]);
  });

  it("같은 점수면 이름이 짧은(더 구체적인) 쪽이 먼저", () => {
    expect(ids("샐러드")).toEqual(["m-salad", "c-salad"]);
  });

  it("문장처럼 적어도 이름이 들어 있으면 찾는다", () => {
    expect(ids("점심에 쌀국수")).toEqual(["m-pho"]);
  });

  it("최대 3개까지만", () => {
    expect(ids("삼각김밥")).toHaveLength(3);
  });

  it("맞는 게 없으면 빈 목록 — 그냥 직접 입력으로 기록된다", () => {
    expect(ids("추러스")).toEqual([]);
  });
});
