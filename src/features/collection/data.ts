/** 도감 책장 탭 (수집 데이터 자체는 API로 — features/collection/api). */
export const COLLECTION_TABS = [
  { value: "recipe", label: "요리" },
  { value: "ingredient", label: "재료" },
  { value: "convenience", label: "간편식" },
] as const;
