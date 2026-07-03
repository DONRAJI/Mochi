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
 * 감량 목표 열량(kcal/day). 살이 빠지려면 유지(TDEE)보다 적게 먹어야 하므로 부드러운 결손을 준다.
 * - 결손 15%(≈주 0.3~0.4kg): 죄책감 제로에 맞는 지속 가능한 속도(굶기 아님).
 * - 하한 = BMR: 기초대사량 밑으로는 절대 권하지 않는다(건강·안전).
 */
const WEIGHT_LOSS_RATIO = 0.85;

export function computeCalorieBudget(tdee: number, bmr: number): number {
  return Math.max(bmr, Math.round(tdee * WEIGHT_LOSS_RATIO));
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
