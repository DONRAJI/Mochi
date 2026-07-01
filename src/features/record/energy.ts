import type { ActivityLevel, Gender } from "./types";

/**
 * 에너지 계산 (BMR/TDEE) — opt-in 프로필 개인화 (PRD 11.4).
 * ⚠️ 이 숫자들은 서버 전용 신호다. 화면엔 절대 kcal 숫자를 띄우지 않는다(불변 #2).
 * 부드러운 가이드("오늘 이 정도면 딱 좋아요")의 근거로만 쓴다.
 */

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  low: 1.375,
  medium: 1.55,
  high: 1.725,
};

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
