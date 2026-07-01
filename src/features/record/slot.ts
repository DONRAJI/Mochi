import type { MealSlot } from "./types";

/**
 * 시간대로 끼니 슬롯 자동추정 (PRD 11.2 — "탭 한 번 + 시간대로 슬롯 자동추정").
 * 클라이언트(브라우저 로컬 시간=KST)에서 계산해 보내는 게 기본, 서버는 없을 때만 폴백.
 * 순수 함수라 테스트 용이.
 */
export function estimateSlot(date: Date): MealSlot {
  const h = date.getHours();
  if (h >= 4 && h <= 10) return "breakfast";
  if (h >= 11 && h <= 15) return "lunch";
  if (h >= 16 && h <= 21) return "dinner";
  return "snack";
}

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export const SLOT_EMOJI: Record<MealSlot, string> = {
  breakfast: "🌅",
  lunch: "🥗",
  dinner: "🌙",
  snack: "🍪",
};
