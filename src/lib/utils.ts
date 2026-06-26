/** 조건부 className 병합 헬퍼 (외부 의존성 없이 가볍게). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
