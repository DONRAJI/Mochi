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
};

describe("첫 안내 (핵심 루프 노출)", () => {
  it("가입 직후엔 세 단계가 모두 남아 있다", () => {
    const steps = buildOnboardingSteps(base);
    expect(steps.map((s) => s.key)).toEqual(["fridge", "record", "draw"]);
    expect(steps.every((s) => !s.done)).toBe(true);
  });

  it("재료를 담고 한 끼 기록하면 그 단계만 완료된다", () => {
    const steps = buildOnboardingSteps({ ...base, hasIngredients: true, hasRecord: true });
    expect(steps.find((s) => s.key === "fridge")?.done).toBe(true);
    expect(steps.find((s) => s.key === "record")?.done).toBe(true);
    expect(steps.find((s) => s.key === "draw")?.done).toBe(false);
  });

  it("씨앗이 모자라면 남은 개수를, 채웠으면 바로 권한다", () => {
    expect(buildOnboardingSteps({ ...base, seeds: 2 }).find((s) => s.key === "draw")?.hint).toBe(
      "씨앗 3개만 더 모으면 뽑아요",
    );
    expect(buildOnboardingSteps({ ...base, seeds: 5 }).find((s) => s.key === "draw")?.hint).toBe(
      "지금 뽑을 수 있어요!",
    );
    // 넘치게 모았어도 재촉 문구가 아니라 권유를 유지한다.
    expect(buildOnboardingSteps({ ...base, seeds: 12 }).find((s) => s.key === "draw")?.hint).toBe(
      "지금 뽑을 수 있어요!",
    );
  });

  it("첫 모찌를 뽑으면 안내가 끝난다", () => {
    expect(isOnboardingComplete(0)).toBe(false);
    expect(isOnboardingComplete(1)).toBe(true);
  });

  it("카드를 한 번 얻으면 스트릭이 끊겨도 안내가 다시 나오지 않는다", () => {
    // 기준이 '모은 카드 수'라 되돌아가지 않는다(오래 쓴 사용자에게 재노출 방지).
    expect(isOnboardingComplete(3)).toBe(true);
    const steps = buildOnboardingSteps({ ...base, collectedCount: 3, hasRecord: false });
    expect(steps.find((s) => s.key === "draw")?.done).toBe(true);
  });

  it("머리말은 진행할수록 같이 기뻐한다 (재촉·지적 없음)", () => {
    const none = onboardingHeadline(buildOnboardingSteps(base));
    const one = onboardingHeadline(buildOnboardingSteps({ ...base, hasIngredients: true }));
    const two = onboardingHeadline(
      buildOnboardingSteps({ ...base, hasIngredients: true, hasRecord: true }),
    );
    expect([none, one, two]).toEqual([
      "모찌를 모으는 방법, 같이 볼까요?",
      "좋아요! 하나 해냈어요",
      "거의 다 왔어요, 조금만 더!",
    ]);
    for (const m of [none, one, two]) {
      expect(m).not.toMatch(/실패|해야|아직 못|안 했/);
    }
  });
});
