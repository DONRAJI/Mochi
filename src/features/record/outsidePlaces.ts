/**
 * '밖에서 먹기' 장소 → 음식 사전 분류 (순수).
 *
 * 왜: 식단 탭의 외식·간편식은 고정 목록 36개라 결정에 도움이 안 됐다(이미 아는 메뉴).
 * 음식 사전(식약처 영양성분 DB)의 외식 데이터는 카페·디저트·버거·치킨·베이커리에 몰려 있고,
 * 다이어트하는 사람이 흔들리는 곳도 바로 여기다 — 같은 카페에서 아메리카노 11kcal, 스무디 415kcal.
 * 장소를 고르면 그 안에서 가벼운 순으로 보여줘 '고르는 순간'을 돕는다.
 *
 * 분류는 원본 이름의 접두어(예: "커피_아메리카노")다. 2026-09 기준 459종이라 전부 나열하지 않고:
 * - 카페·빵집·버거는 접두어 목록으로
 * - 식사는 이름 끝말(밥·국·탕·찌개·면…) + 최소 kcal로 가른다 — 된장국·나물 같은 곁들이는 빠진다
 * - 피자는 어디에도 넣지 않는다 — 데이터가 '한 판' 단위라 조각 기준이 없다
 *
 * ⚠️ 서버 조회 조건(food.service whereForPlace)이 이 목록을 그대로 쓴다. placeOf와 1:1이어야 한다.
 */

export const OUTSIDE_PLACES = ["cafe", "bakery", "fastfood", "meal"] as const;
export type OutsidePlace = (typeof OUTSIDE_PLACES)[number];

export const PLACE_INFO: Record<OutsidePlace, { emoji: string; label: string }> = {
  cafe: { emoji: "☕", label: "카페" },
  bakery: { emoji: "🥐", label: "빵집·디저트" },
  fastfood: { emoji: "🍔", label: "버거·치킨" },
  meal: { emoji: "🍚", label: "식사 한 끼" },
};

const CAFE = [
  "커피", "라떼", "스무디", "에이드", "아이스티", "기타차", "허브차", "홍차", "자몽차", "과ㆍ채주스",
  "밀크티/버블티", "유자차", "레몬차", "뱅쇼", "기타음료", "녹차", "귤차", "자몽홍차", "생강차", "코코아",
  "우롱차", "쌍화차", "미숫가루", "사과차", "콤부차", "오미자차", "마테차", "대추차", "복숭아홍차", "꿀차",
  "밀크티", "레몬홍차", "액상커피", "아이스 카페모카", "카페모카", "아이스 카페라떼", "카페라떼",
  "두유 카페라떼", "율무차", "밀크쉐이크", "미숫가루(선식)음료", "요구르트(액상)", "식혜",
] as const;

const BAKERY = [
  "케이크", "아이스크림", "도넛", "와플", "마카롱", "크로플", "빙수", "베이글", "크림빵",
  "비스킷/쿠키/크래커", "식빵", "크로와상", "페이스트리", "치즈빵", "크로켓(고로케)", "머핀", "프레즐",
  "바게트", "허니브레드", "스콘", "파이/만주", "팥빵", "소보로빵", "번", "츄러스", "기타빵", "토스트",
  "카스텔라", "모닝빵", "소세지빵", "타르트", "소금빵", "피자빵", "롤빵", "앙금빵", "치아바타", "효모빵",
  "버터빵", "감자빵", "야채빵", "찰떡빵", "깨찰빵", "파운드케이크", "호밀빵", "마늘빵", "계란빵",
  "건포도빵", "샌드위치", "햄샌드위치", "샤베트", "팥빙수", "호떡", "또띠아", "요구르트(호상)",
  "초콜릿", "젤리", "캔디", "웨이퍼", "찹쌀떡",
] as const;

const FASTFOOD = [
  "버거", "햄버거", "닭튀김", "핫도그", "감자튀김", "치즈볼", "치즈스틱", "닭다리튀김", "새우튀김",
  "오징어튀김", "닭모래집튀김", "닭발튀김", "닭껍데기튀김", "떡강정", "탄산음료",
] as const;

/** 어느 장소에도 넣지 않는다 — '한 판' 단위라 조각 기준이 없다. */
const EXCLUDED = ["피자"] as const;

/**
 * 한 끼로 볼 이름 끝말. "밥"이 덮밥·국밥·비빔밥·볶음밥·김밥·초밥을, "면"이 냉면·라면·짜장면을,
 * "탕"이 곰탕·마라탕을 함께 잡는다.
 */
export const MEAL_SUFFIXES = [
  "밥", "국", "탕", "찌개", "전골", "국수", "면", "우동", "라멘", "짬뽕", "죽", "정식", "백반", "떡볶이",
  "스파게티", "파스타", "가스", "까스", "라이스", "리조또", "리소토", "샤브샤브", "수제비", "나베", "훠궈",
  "팟타이", "그라탕", "스테이크",
] as const;

/** 한 끼 최소 kcal — 된장국(약 80)·나물 같은 곁들이는 빼고 김치찌개(244)는 남는다. */
export const MEAL_MIN_KCAL = 200;

const CATEGORIES: Record<Exclude<OutsidePlace, "meal">, readonly string[]> = {
  cafe: CAFE,
  bakery: BAKERY,
  fastfood: FASTFOOD,
};

/** 식사 조회에서 제외할 분류 — 카페·빵집·버거·피자에 속한 건 이름이 '밥'으로 끝나도 식사가 아니다. */
export const NON_MEAL_CATEGORIES: readonly string[] = [...CAFE, ...BAKERY, ...FASTFOOD, ...EXCLUDED];

export function categoriesOf(place: Exclude<OutsidePlace, "meal">): readonly string[] {
  return CATEGORIES[place];
}

const PLACE_BY_CATEGORY = new Map<string, OutsidePlace>(
  (Object.keys(CATEGORIES) as Exclude<OutsidePlace, "meal">[]).flatMap((place) =>
    CATEGORIES[place].map((c) => [c, place] as const),
  ),
);
const EXCLUDED_SET = new Set<string>(EXCLUDED);

/** 사전 항목이 어느 장소에 속하는지. 어디에도 안 속하면 null. */
export function placeOf(entry: {
  name: string;
  category: string | null;
  kcal: number;
}): OutsidePlace | null {
  if (entry.category) {
    const place = PLACE_BY_CATEGORY.get(entry.category);
    if (place) return place;
    if (EXCLUDED_SET.has(entry.category)) return null;
  }
  if (entry.kcal >= MEAL_MIN_KCAL && MEAL_SUFFIXES.some((s) => entry.name.endsWith(s))) {
    return "meal";
  }
  return null;
}
