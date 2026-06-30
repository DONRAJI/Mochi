/**
 * 영양 신호 → 랭킹 뱃지 자동 산출 (수기 X). kcal/protein은 서버 전용 — 화면엔 안 띄운다(불변 #2).
 * 단백질 칼로리 비율 높으면 단백질 · 저칼로리면 가벼움 · 그 외 포만감.
 */
export function deriveBadge(kcal: number | null, protein: number | null): string {
  if (protein != null && kcal != null && kcal > 0 && (protein * 4) / kcal >= 0.3) {
    return "💪 단백질";
  }
  if (kcal != null && kcal <= 350) return "🍃 가벼움";
  return "🫧 포만감";
}
