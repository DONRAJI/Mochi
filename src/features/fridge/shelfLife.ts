/**
 * 재료 보관 기간 추정 + 냉장고 분류 (순수).
 *
 * 왜: 유통기한은 '직접 입력'에 날짜를 적을 때만 저장돼서, 스티커로 톡 담거나 장보기에서 옮긴 재료는
 * 전부 비어 있었다 — 그래서 '곧 써보면 좋아요' 선반, 임박 재료 추천 가산점, 리마인더의 재료 문구가
 * 대부분의 사용자에게 사실상 꺼져 있었다. 날짜를 적게 하는 건 설정 부담이라, 담는 순간 재료별
 * **대략적인 냉장 보관 기간**으로 채운다. 추정값이므로 화면엔 D-n 같은 날짜 수를 보여주지 않는다.
 *
 * 기간은 개봉 전 냉장 기준의 보수적인 값(식약처·소비자원 가정 보관 안내의 통상 범위). 쌀·곡물·양념처럼
 * 오래 두는 건 null(추정 안 함). 정확한 날짜를 아는 사람은 여전히 직접 적을 수 있다.
 */

/** 재료 마스터(1,011종) 분류 → 냉장고 탭 분류. 없는 분류(양념·오일·당류 등)는 '기타'. */
const FRIDGE_CATEGORY: Record<string, string> = {
  채소: "채소",
  단백질: "단백질",
  가공육: "단백질",
  가공수산: "단백질",
  유제품: "유제품",
  곡물: "곡물",
  과일: "과일",
};

export function fridgeCategoryOf(masterCategory: string | null | undefined): string {
  return (masterCategory && FRIDGE_CATEGORY[masterCategory]) || "기타";
}

/** 이름별 보관 일수 — 분류 기본값과 크게 다른 흔한 재료만. null = 추정 안 함(오래 둠·가공품). */
const DAYS_BY_NAME: Record<string, number | null> = {
  계란: 21,
  달걀: 21,
  두부: 5,
  닭가슴살: 2,
  새우: 2,
  연어: 2,
  오징어: 2,
  참치: null, // 대부분 통조림
  콩: null, // 대부분 건조
  양파: 30,
  감자: 30,
  고구마: 14,
  당근: 14,
  마늘: 21,
  김치: 30,
  상추: 4,
  딸기: 3,
  사과: 21,
  레몬: 14,
  치즈: 21,
  버터: 30,
  요거트: 10,
  빵: 4,
};

/** 분류 기본값 — 곡물·기타(양념 등)는 추정하지 않는다. */
const DAYS_BY_CATEGORY: Record<string, number> = {
  채소: 7,
  단백질: 3,
  유제품: 7,
  과일: 5,
};

export function shelfLifeDays(name: string, fridgeCategory: string): number | null {
  const key = name.trim();
  if (key in DAYS_BY_NAME) return DAYS_BY_NAME[key];
  return DAYS_BY_CATEGORY[fridgeCategory] ?? null;
}

/** 담은 순간부터 보관 일수만큼 — 추정할 수 없는 재료는 null. */
export function estimateExpiry(name: string, fridgeCategory: string, from: Date): Date | null {
  const days = shelfLifeDays(name, fridgeCategory);
  return days == null ? null : new Date(from.getTime() + days * 86_400_000);
}
