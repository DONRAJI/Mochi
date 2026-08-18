/**
 * 첫 안내 — 핵심 루프(제안 → 기록 → 수집)를 첫날에 보이게 한다.
 *
 * 왜 필요한가: 가입 직후 홈에는 씨앗이 뭔지, 왜 '먹었어요'를 눌러야 하는지, 뽑기가 있는지가
 * 어디에도 없었다. 도감 탭을 우연히 열어야 알게 되는 구조라 리텐션 엔진(뽑기)이 첫날 보이지
 * 않았다. 튜토리얼 벽을 세우는 대신, 홈에 접힌 안내 하나로 "하면서 배우게" 한다.
 *
 * 죄책감 제로(불변 #1): 못 한 걸 지적하지 않는다. 명령형("하세요") 대신 권유형이고,
 * 완료 못 한 단계도 흐리게 두지 않고 다음에 할 것으로만 보여준다.
 */

export type OnboardingStepKey = "fridge" | "record" | "draw";

export interface OnboardingStep {
  key: OnboardingStepKey;
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
  return [
    {
      key: "fridge",
      emoji: "🧊",
      label: "냉장고에 재료 담기",
      hint: "가진 재료로 만들 수 있는 요리를 찾아줘요",
      href: "/fridge",
      done: input.hasIngredients,
    },
    {
      key: "record",
      emoji: "🍽️",
      label: "한 끼 기록하기",
      hint: "'먹었어요'를 누르면 모찌 씨앗이 쌓여요",
      href: "/meals",
      done: input.hasRecord,
    },
    {
      key: "draw",
      emoji: "🎁",
      label: "씨앗으로 모찌 뽑기",
      hint: drawHint(input.seeds, input.drawCost),
      href: "/collection",
      done: isOnboardingComplete(input.collectedCount),
    },
  ];
}

/** 안내 카드 머리말 — 진행할수록 모찌가 같이 기뻐한다(재촉 아님). */
export function onboardingHeadline(steps: OnboardingStep[]): string {
  const done = steps.filter((s) => s.done).length;
  if (done === 0) return "모찌를 모으는 방법, 같이 볼까요?";
  if (done === 1) return "좋아요! 하나 해냈어요";
  return "거의 다 왔어요, 조금만 더!";
}
