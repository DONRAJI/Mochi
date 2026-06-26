import "server-only";
import type { MochiState } from "@/types/mochi";

/**
 * mochi 도메인 서비스 — 비즈니스 로직은 여기서만, Prisma 호출도 여기서만 (structure.md 레이어 규칙).
 * P0 골격: 아직 DB 없이 상태를 계산해 돌려준다. auth/record 연결 후 db(streak·시간대 등) 기반으로 확장.
 */
export interface MochiStateResponse {
  state: MochiState;
}

export async function getMochiState(): Promise<MochiStateResponse> {
  // TODO(record 연동): 마지막 기록·시간대·스트릭으로 상태 결정. 지금은 시간대 기반 데모.
  const hour = new Date().getHours();
  const state: MochiState = hour >= 23 || hour < 6 ? "sleepy" : "idle";
  return { state };
}
