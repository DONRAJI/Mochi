import { describe, it, expect } from "vitest";
import { collectionQuerySchema } from "./types";

describe("collection query", () => {
  it("유효한 type 통과", () => {
    expect(collectionQuerySchema.safeParse({ type: "recipe" }).success).toBe(true);
    expect(collectionQuerySchema.safeParse({ type: "convenience" }).success).toBe(true);
  });
  it("잘못된 type 거부", () => {
    expect(collectionQuerySchema.safeParse({ type: "menu" }).success).toBe(false);
  });
});
