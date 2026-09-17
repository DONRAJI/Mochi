import { describe, it, expect } from "vitest";
import {
  buildOnboardingSteps,
  isOnboardingComplete,
  onboardingHeadline,
  type OnboardingInput,
} from "./onboarding";

const base: OnboardingInput = {
  hasIngredients: false,
  hasRecord: false,
  seeds: 0,
  drawCost: 5,
  collectedCount: 0,
  cooksOften: false,
};

describe("첫 안내 (핵심 루프 노출)", () => {
  it("첫날 길은 기록 → 뽑기 — 밖에서 먹는 사람에겐 냉장고 단계가 없다", () => {
    const steps = buildOnboardingSteps(base);
    expect(steps.map((s) => s.key)).toEqual(["record", "draw"]);
    expect(steps.every((s) => !s.done && !s.optional)).toBe(true);
  });

  it("요리를 자주 한다고 고른 사람에겐 냉장고가 맨 뒤 선택 단계로", () => {
    const steps = buildOnboardingSteps({ ...base, cooksOften: true });
    expect(steps.map((s) => s.key)).toEqual(["record", "draw", "fridge"]);
    expect(steps.find((s) => s.key === "fridge")?.optional).toBe(true);
  });

  it("한 끼 기록하면 그 단계만 완료된다", () => {
    const steps = buildOnboardingSteps({ ...base, hasRecord: true });
    expect(steps.find((s) => s.key === "record")?.done).toBe(true);
    expect(steps.find((s) => s.key === "draw")?.done).toBe(false);
  });

  it("씨앗이 모자라면 남은 개수를, 채웠으면 바로 권한다", () => {
    const hint = (seeds: number) =>
      buildOnboardingSteps({ ...base, seeds }).find((s) => s.key === "draw")?.hint;
    expect(hint(2)).toBe("씨앗 3개만 더 모으면 뽑아요");
    expect(hint(5)).toBe("지금 뽑을 수 있어요!");
    // 넘치게 모았어도 재촉 문구가 아니라 권유를 유지한다.
    expect(hint(12)).toBe("지금 뽑을 수 있어요!");
  });

  it("첫 모찌를 뽑으면 안내가 끝난다 — 냉장고(선택)를 안 해도", () => {
    expect(isOnboardingComplete(0)).toBe(false);
    expect(isOnboardingComplete(1)).toBe(true);
    const steps = buildOnboardingSteps({ ...base, cooksOften: true, collectedCount: 1 });
    expect(steps.find((s) => s.key === "fridge")?.done).toBe(false);
  });

  it("카드를 한 번 얻으면 스트릭이 끊겨도 안내가 다시 나오지 않는다", () => {
    // 기준이 '모은 카드 수'라 되돌아가지 않는다(오래 쓴 사용자에게 재노출 방지).
    expect(isOnboardingComplete(3)).toBe(true);
    const steps = buildOnboardingSteps({ ...base, collectedCount: 3, hasRecord: false });
    expect(steps.find((s) => s.key === "draw")?.done).toBe(true);
  });

  it("머리말은 진행할수록 같이 기뻐한다 — 선택 단계는 세지 않는다 (재촉·지적 없음)", () => {
    const none = onboardingHeadline(buildOnboardingSteps({ ...base, hasIngredients: true }), false);
    const recorded = onboardingHeadline(buildOnboardingSteps({ ...base, hasRecord: true }), false);
    const ready = onboardingHeadline(buildOnboardingSteps({ ...base, hasRecord: true }), true);
    expect([none, recorded, ready]).toEqual([
      "모찌를 모으는 방법, 같이 볼까요?",
      "좋아요! 씨앗이 모이고 있어요",
      "거의 다 왔어요, 첫 모찌를 만나볼까요?",
    ]);
    for (const m of [none, recorded, ready]) {
      expect(m).not.toMatch(/실패|해야|아직 못|안 했/);
    }
  });
});
