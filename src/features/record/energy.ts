import type { ActivityLevel, Gender } from "./types";

/**
 * 에너지 계산 (BMR/TDEE) — opt-in 프로필 개인화 (PRD 11.4).
 * ⚠️ 이 숫자들은 서버 전용 신호다. 화면엔 절대 kcal 숫자를 띄우지 않는다(불변 #2).
 * 부드러운 가이드("오늘 이 정도면 딱 좋아요")의 근거로만 쓴다.
 */

// 타깃(자취·좌식 생활)에 맞춰 sedentary를 하한으로 — 예전 값(1.375~)은 활동량을 과대평가해
// TDEE가 부풀었다. low=거의 앉아 지냄, medium=가벼운 활동, high=활발.
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  low: 1.2,
  medium: 1.375,
  high: 1.55,
};

/**
 * 감량 목표 열량(kcal/day) = 유지(TDEE) − 500, 단 최소 섭취량 아래로는 내리지 않는다.
 *
 * 예전엔 `max(BMR, TDEE × 0.85)`였고 두 가지가 감량 목적과 어긋났다:
 * - 15% 결손은 TDEE 3,333 미만이면 항상 500보다 작다 → 흔한 감량 기준보다 늘 느슨했다.
 * - **하한이 BMR**이라, 체중이 많이 나갈수록(= BMR이 높을수록) −500 자체가 막혔다.
 *   예) 남 26세 181cm 96kg 좌식: TDEE 2,359 → −500은 1,859인데 BMR 1,966에 걸려 2,005였다.
 *
 * 하한은 BMR 대신 **일반적으로 많이 쓰는 최소 섭취량**(남 1,500 / 여 1,200)으로 둔다.
 * 체중이 적은 사용자는 여전히 보호되고, 많이 나가는 사용자에겐 −500이 제대로 적용된다.
 * 성별 '기타'는 보수적으로 높은 쪽(1,500). 일반 기준일 뿐 의료 조언이 아니다.
 *
 * 단 **TDEE보다 높은 목표는 주지 않는다** — 유지 칼로리가 하한보다 낮은 사용자에게 하한을
 * 그대로 주면 '감량 목표'가 오히려 더 먹으라는 목표가 된다. 그땐 유지 칼로리가 목표다.
 */
export const DAILY_DEFICIT = 500;

export const MIN_DAILY_INTAKE: Record<Gender, number> = {
  male: 1500,
  female: 1200,
  other: 1500,
};

export function computeCalorieBudget(tdee: number, gender: Gender): number {
  return Math.min(tdee, Math.max(MIN_DAILY_INTAKE[gender], tdee - DAILY_DEFICIT));
}

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return Math.max(0, now.getFullYear() - birthYear);
}

/** Mifflin-St Jeor BMR (kcal/day). gender=other는 남녀 오프셋 평균. */
export function computeBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const offset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  return Math.round(base + offset);
}

export function computeTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTOR[activity]);
}
