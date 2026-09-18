/** 식단 모드/정렬 UI 상수 (추천 데이터 자체는 API로 — features/recommend/api). */
/**
 * 식단 탭 첫 갈래 — 요리 / 밖에서.
 * 예전엔 요리·외식·간편식 세 모드였는데, 외식·간편식이 고정 목록 36개라 결정에 도움이 안 됐다.
 * '밖에서'는 장소(카페·빵집·버거·식사·편의점)를 고르는 화면이다. 기록·즐겨찾기에 쓰는 모드 값
 * (cook/eatout/convenience)은 DB와 여러 곳이 쓰므로 그대로 두고 MealsScreen이 파생한다.
 */
export const SORT_FILTERS = ["15분 이내", "추가구매 없음", "단백질 위주", "가볍게"] as const;
