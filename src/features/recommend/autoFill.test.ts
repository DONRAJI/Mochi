import { describe, it, expect } from "vitest";
import { AUTO_FILL_POOL, pickAutoFillRecipes } from "./autoFill";

const ranked = (n: number, expiring: number[] = []) =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i}`, usesExpiring: expiring.includes(i) }));

/** 결정적 난수 — 테스트마다 같은 결과 */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("자동 채우기 요리 고르기", () => {
  it("한 주 안에서 같은 요리를 두 번 넣지 않는다", () => {
    const picks = pickAutoFillRecipes(ranked(60), 7, new Set(), seeded(1));
    expect(picks).toHaveLength(7);
    expect(new Set(picks.map((p) => p.id)).size).toBe(7);
  });

  it("누를 때마다 달라진다 — 늘 1위부터 순서대로가 아니다", () => {
    const results = new Set(
      [1, 2, 3, 4, 5].map((s) =>
        pickAutoFillRecipes(ranked(60), 7, new Set(), seeded(s))
          .map((p) => p.id)
          .join(","),
      ),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it(`후보는 상위 ${AUTO_FILL_POOL}개 안에서만`, () => {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      for (const p of pickAutoFillRecipes(ranked(200), 7, new Set(), seeded(s))) {
        expect(Number(p.id.slice(1))).toBeLessThan(AUTO_FILL_POOL);
      }
    }
  });

  it("순위가 높을수록 더 자주 뽑힌다", () => {
    let top10 = 0;
    let bottom10 = 0;
    const random = seeded(42);
    for (let i = 0; i < 300; i++) {
      const [first] = pickAutoFillRecipes(ranked(50), 1, new Set(), random);
      const rank = Number(first.id.slice(1));
      if (rank < 10) top10 += 1;
      if (rank >= 40) bottom10 += 1;
    }
    expect(top10).toBeGreaterThan(bottom10);
    expect(bottom10).toBeGreaterThan(0); // 아래쪽도 가끔은
  });

  it("임박 재료 요리는 섞지 않고 가장 가까운 날부터", () => {
    const picks = pickAutoFillRecipes(ranked(50, [30, 5]), 3, new Set(), seeded(7));
    expect(picks.slice(0, 2).map((p) => p.id)).toEqual(["r5", "r30"]);
  });

  it("이번 주에 이미 담아둔 요리는 빼고, 후보가 모자랄 때만 겹친다", () => {
    const picks = pickAutoFillRecipes(ranked(50), 5, new Set(["r0", "r1"]), seeded(3));
    expect(picks.some((p) => p.id === "r0" || p.id === "r1")).toBe(false);
    expect(pickAutoFillRecipes(ranked(3), 5, new Set(), seeded(3))).toHaveLength(5);
  });
});
