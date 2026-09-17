/**
 * 첫 안내 — 핵심 루프(기록 → 뽑기)를 첫날에 보이게 한다.
 *
 * 왜 필요한가: 가입 직후 홈에는 씨앗이 뭔지, 왜 '먹었어요'를 눌러야 하는지, 뽑기가 있는지가
 * 어디에도 없었다. 도감 탭을 우연히 열어야 알게 되는 구조라 리텐션 엔진(뽑기)이 첫날 보이지
 * 않았다. 튜토리얼 벽을 세우는 대신, 홈에 접힌 안내 하나로 "하면서 배우게" 한다.
 *
 * 죄책감 제로(불변 #1): 못 한 걸 지적하지 않는다. 명령형("하세요") 대신 권유형이고,
 * 완료 못 한 단계도 흐리게 두지 않고 다음에 할 것으로만 보여준다.
 *
 * 순서(2026-09-17): 예전엔 1단계가 '냉장고에 재료 담기'였다 — 가장 손이 많이 가는 일이 맨 앞이었고,
 * 밖에서 사 먹는 사람에겐 필요 없는 일이었다. 첫날 목표는 **먹었어요 → 씨앗 → 첫 뽑기**를 가장 짧게.
 * 냉장고는 가입 때 '요리를 자주 한다'고 고른 사람에게만 선택 단계로 보인다(완료 기준·머리말에 안 셈).
 */

export type OnboardingStepKey = "fridge" | "record" | "draw";

export interface OnboardingStep {
  key: OnboardingStepKey;
  /** 선택 단계 — 안 해도 첫 안내를 마칠 수 있다 */
  optional: boolean;
  emoji: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

export interface OnboardingInput {
  /** 냉장고에 재료를 하나라도 담았는가 */
  hasIngredients: boolean;
  /** '먹었어요'를 한 번이라도 눌렀는가 */
  hasRecord: boolean;
  seeds: number;
  drawCost: number;
  /** 모은 모찌 카드 수 */
  collectedCount: number;
  /** 가입 때 '요리를 자주 한다'를 골랐는가 — 냉장고 단계를 보여줄지 */
  cooksOften: boolean;
}

/**
 * 첫 모찌를 뽑았으면 루프를 한 바퀴 돈 것 — 안내를 영구히 거둔다.
 *
 * 카드 수를 기준으로 삼는 이유: 카드는 한 번 얻으면 사라지지 않아서, 오래 쓴 사용자에게
 * 안내가 다시 튀어나오는 일이 없다. (스트릭은 끊기면 다시 낮아질 수 있어 기준으로 부적합.)
 */
export function isOnboardingComplete(collectedCount: number): boolean {
  return collectedCount > 0;
}

/** 남은 씨앗 안내 문구 — 모자랄 때만 개수를 말하고, 채웠으면 바로 권한다. */
function drawHint(seeds: number, drawCost: number): string {
  if (seeds >= drawCost) return "지금 뽑을 수 있어요!";
  const left = drawCost - seeds;
  return `씨앗 ${left}개만 더 모으면 뽑아요`;
}

export function buildOnboardingSteps(input: OnboardingInput): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    {
      key: "record",
      optional: false,
      emoji: "🍽️",
      label: "한 끼 기록하기",
      hint: "먹은 걸 이름만 적어도 씨앗이 쌓여요",
      href: "/meals?segment=outside",
      done: input.hasRecord,
    },
    {
      key: "draw",
      optional: false,
      emoji: "🎁",
      label: "씨앗으로 모찌 뽑기",
      hint: drawHint(input.seeds, input.drawCost),
      href: "/collection",
      done: isOnboardingComplete(input.collectedCount),
    },
  ];
  if (input.cooksOften) {
    steps.push({
      key: "fridge",
      optional: true,
      emoji: "🧊",
      label: "냉장고에 재료 담기 (요리한다면)",
      hint: "가진 재료로 만들 수 있는 요리를 먼저 보여줘요",
      href: "/fridge",
      done: input.hasIngredients,
    });
  }
  return steps;
}

/** 안내 카드 머리말 — 진행할수록 모찌가 같이 기뻐한다(재촉 아님). 선택 단계는 세지 않는다. */
export function onboardingHeadline(steps: OnboardingStep[], canDraw: boolean): string {
  const recorded = steps.some((s) => s.key === "record" && s.done);
  if (!recorded) return "모찌를 모으는 방법, 같이 볼까요?";
  if (!canDraw) return "좋아요! 씨앗이 모이고 있어요";
  return "거의 다 왔어요, 첫 모찌를 만나볼까요?";
}
