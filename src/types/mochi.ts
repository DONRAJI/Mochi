/**
 * 제품 불변 규칙 #3: 모찌 상태는 이 유니온만. 임의 문자열 상태 추가 금지.
 * (Prisma `enum MochiState`와 값이 정확히 일치해야 한다 — prisma/schema.prisma)
 */
export type MochiState = "happy" | "sleepy" | "idle" | "cheer";

export const MOCHI_STATES: readonly MochiState[] = ["happy", "sleepy", "idle", "cheer"] as const;

export function isMochiState(value: string): value is MochiState {
  return (MOCHI_STATES as readonly string[]).includes(value);
}
