/** 식단 모드/정렬 UI 상수 (추천 데이터 자체는 API로 — features/recommend/api). */
export const MEAL_MODES = [
  { value: "cook", label: "요리" },
  { value: "eatout", label: "외식/배달" },
  { value: "convenience", label: "간편식" },
] as const;

export const SORT_FILTERS = ["15분 이내", "추가구매 없음", "단백질 위주", "가벼움"] as const;
