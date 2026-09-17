/**
 * 영양 신호 → 뱃지 자동 산출 (수기 X). kcal/protein은 서버 전용 — 화면엔 안 띄운다(불변 #2).
 * 단백질 칼로리 비율이 높으면 "💪 단백질", 아니면 null.
 *
 * 예전엔 여기서 '가벼움/포만감'도 줬는데, 단백질이 높으면 양감이 가려져 900kcal 요리도 "단백질"로만
 * 보였다. 양감은 세 단계 라벨(lib/portion)로 따로 늘 싣고, 이 뱃지는 단백질 신호만 맡는다.
 * 영양을 모르면 null — 근거 없는 뱃지를 지어내지 않는다(정직화).
 */
export function deriveBadge(kcal: number | null, protein: number | null): string | null {
  if (protein != null && kcal != null && kcal > 0 && (protein * 4) / kcal >= 0.3) {
    return "💪 단백질";
  }
  return null;
}
