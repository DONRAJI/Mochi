import type { MochiState } from "@/types/mochi";

export interface MochiStateResponse {
  state: MochiState;
  growthStage: number; // 누적 기록 수에 따라 성장 (1~5, growth.ts)
  /** 모은 **모찌 카드** 수. 음식 CollectionEntry(먹었어요 부산물)는 세지 않는다 — mochi.service 주석 참고. */
  collectedCount: number;
  /** 지금까지 잘 먹은 날의 누적 기록 수 — 성장 단계와 '다음 단계까지' 안내의 근거. */
  mealCount: number;
  /**
   * 첫 안내(StartHereCard)가 씨앗 진척을 보여주기 위한 값. 도감 전체(카드 20장)를 홈에서
   * 또 불러오지 않으려고 이 응답에 함께 싣는다. 씨앗은 게임 재화라 불변 #2(체중·칼로리)와
   * 무관하고, 홈에 이미 노출되는 스트릭 일수와 같은 층위다.
   */
  seeds: number;
  drawCost: number;
}
