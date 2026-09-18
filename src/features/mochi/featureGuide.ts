/**
 * 기능 안내 (순수) — 마이 '모찌 사용법' 페이지와, 첫 모찌를 뽑은 뒤 홈에 한 번 뜨는 소개 카드의 내용.
 *
 * 왜: 첫 안내(onboarding.ts)는 핵심 루프(재료 → 기록 → 뽑기)만 알려주고 첫 뽑기와 함께 사라진다.
 * 그 뒤에 쓸 기능 — 숫자도 보는 모드·체중 기록·사진 기록 — 은 화면에 있어도 설명이 없어 안 쓰였다.
 * 첫 안내에 단계를 더하면 루프 완주가 줄고, 첫날부터 '숫자 모드'를 권하는 건 숫자 숨김 기본(불변 #2)과
 * 어긋난다. 그래서 루프를 한 바퀴 돈 순간(첫 모찌) 짧게 소개하고, 전체는 마이에 모아둔다.
 *
 * 죄책감 제로(불변 #1): "써야 한다"가 아니라 "이런 것도 있어요". 문구 금지어는 테스트가 검사한다.
 */

export interface GuideItem {
  key: string;
  emoji: string;
  title: string;
  /** 어디에 있는지 — 페이지에서 바로가기 버튼 문구로 쓴다 */
  where: string;
  body: string;
  href: string;
}

export interface GuideSection {
  key: string;
  emoji: string;
  title: string;
  items: GuideItem[];
}

export const FEATURE_GUIDE_HREF = "/me/guide";

export const FEATURE_GUIDE: readonly GuideSection[] = [
  {
    key: "record",
    emoji: "🍽️",
    title: "먹은 걸 남기기",
    items: [
      {
        key: "quick-record",
        emoji: "✍️",
        title: "먹었어요",
        where: "홈 · 먹었어요",
        body: "이름만 적어도 한 끼로 남아요. 적다 보면 비슷한 음식 후보가 떠서 골라 담을 수 있어요.",
        href: "/",
      },
      {
        key: "photo",
        emoji: "📷",
        title: "사진 한 장으로 기록",
        where: "홈 · 📷 사진",
        body: "요리하지 않은 날엔 먹은 걸 찍기만 해도 돼요. 씨앗도 똑같이 쌓여요.",
        href: "/",
      },
      {
        key: "outside",
        emoji: "🏪",
        title: "밖에서 먹었을 때",
        where: "홈 · 먹었어요",
        body: "이름을 적는 대신 카페·편의점·식사처럼 있던 곳을 고르면, 여러 곳에서 파는 메뉴가 가벼운 것부터 떠요. 누르면 그대로 기록돼요.",
        href: "/",
      },
    ],
  },
  {
    key: "numbers",
    emoji: "🔢",
    title: "숫자로 챙기기 (원할 때만)",
    items: [
      {
        key: "display-mode",
        emoji: "👀",
        title: "숫자도 보는 모드",
        where: "마이 · 표시 모드",
        body: "기본은 숫자 없이 편하게예요. '숫자도 볼래요'로 바꾸면 식단·기록에 칼로리와 오늘의 여유가 보여요. 홈에는 어느 쪽이든 숫자가 없고, 언제든 되돌릴 수 있어요.",
        href: "/me",
      },
      {
        key: "weight",
        emoji: "⚖️",
        title: "체중 기록",
        where: "마이 · 체중 기록",
        body: "재고 싶은 날만 적어도 괜찮아요. 쌓이면 주간·월별·연간 흐름으로 부드럽게 보여줘요.",
        href: "/me/weight",
      },
      {
        key: "history",
        emoji: "⏳",
        title: "기록 되돌아보기",
        where: "마이 · 기록 되돌아보기",
        body: "날짜별로 먹은 것과 체중 흐름을 다시 볼 수 있어요.",
        href: "/me/history",
      },
    ],
  },
  {
    key: "plan",
    emoji: "🗓️",
    title: "식단 챙기기",
    items: [
      {
        key: "week",
        emoji: "📅",
        title: "이번 주 식단",
        where: "식단 · 이번 주",
        body: "요리를 끼니에 담아두면 홈에 오늘·내일 끼니가 떠요. 매주 비슷하게 먹는다면 프리셋으로 저장해 한 번에 채울 수 있어요.",
        href: "/meals?view=week",
      },
      {
        key: "favorites",
        emoji: "❤️",
        title: "즐겨찾기 · 내 요리",
        where: "식단 · 요리",
        body: "마음에 드는 요리는 하트로 모아 보고, 자주 만드는 나만의 요리는 등록해두면 추천에 함께 떠요.",
        href: "/meals",
      },
    ],
  },
  {
    key: "fridge",
    emoji: "🧊",
    title: "냉장고",
    items: [
      {
        key: "ingredients",
        emoji: "🥕",
        title: "재료 담기",
        where: "냉장고",
        body: "가진 재료를 담으면 그걸로 만들 수 있는 요리를 먼저 추천해요. 유통기한이 가까운 재료는 따로 모아 보여줘요.",
        href: "/fridge",
      },
      {
        key: "shopping",
        emoji: "🛒",
        title: "장보기 리스트",
        where: "냉장고 · 장보기",
        body: "살 재료를 적어두고 체크하면 산 재료가 냉장고로 옮겨져요.",
        href: "/fridge",
      },
    ],
  },
  {
    key: "mochi",
    emoji: "🎁",
    title: "모찌 모으기",
    items: [
      {
        key: "draw",
        emoji: "🌱",
        title: "씨앗과 뽑기",
        where: "도감",
        body: "한 끼를 남길 때마다 씨앗이 쌓이고, 씨앗으로 모찌를 뽑아 도감을 채워요. 모은 도감은 자랑하기로 친구에게 보여줄 수 있어요.",
        href: "/collection",
      },
      {
        key: "reminder",
        emoji: "🔔",
        title: "저녁 리마인더",
        where: "마이 · 설정",
        body: "켜두면 저녁 무렵 뭐 먹을지 같이 보자고 알려줘요. 이미 기록한 날엔 오지 않아요.",
        href: "/me/settings",
      },
    ],
  },
];

export interface DiscoveryItem {
  key: string;
  emoji: string;
  label: string;
  hint: string;
  /** null이면 이동 없이 설명만 — 사진 버튼은 같은 홈 화면 아래에 있다 */
  href: string | null;
}

/**
 * 첫 모찌 뒤 홈 소개 카드 — 화면에 있는데 설명이 없어 안 쓰이던 셋만.
 * 홈 카드라 숫자를 쓰지 않는다(불변 #2, 테스트로 검사).
 */
export const DISCOVERY_ITEMS: readonly DiscoveryItem[] = [
  {
    key: "photo",
    emoji: "📷",
    label: "사진 한 장으로 기록",
    hint: "요리 안 한 날은 아래 📷 버튼으로 찍기만 해요",
    href: null,
  },
  {
    key: "weight",
    emoji: "⚖️",
    label: "체중 기록",
    hint: "재고 싶은 날만 적어도 괜찮아요",
    href: "/me/weight",
  },
  {
    key: "display-mode",
    emoji: "👀",
    label: "숫자도 보는 모드",
    hint: "원하면 식단·기록에 칼로리를 띄워요",
    href: "/me",
  },
];

/** 소개 카드를 닫았는지 — 기기에 계정별로 남긴다(같은 기기에서 다른 계정이면 그 계정엔 다시 뜬다). */
export function featureTourStorageKey(userId: string): string {
  return `mochi:featureTour:${userId}`;
}

/** 첫 모찌를 뽑아 첫 안내가 끝났고, 아직 닫지 않았을 때만. */
export function shouldShowFeatureTour(input: {
  collectedCount: number;
  dismissed: boolean;
}): boolean {
  return input.collectedCount > 0 && !input.dismissed;
}
