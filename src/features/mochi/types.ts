import type { MochiState } from "@/types/mochi";

export interface MochiStateResponse {
  state: MochiState;
  growthStage: number; // 수집 수에 따라 성장 (1~5)
  collectedCount: number;
}
