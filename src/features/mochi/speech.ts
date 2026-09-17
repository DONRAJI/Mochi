import type { MochiState } from "@/types/mochi";

/**
 * 모찌 말풍선 (순수) — 시간대·요일·오늘 먹었는지·씨앗·잘 먹은 날로 매번 다른 한마디.
 *
 * 왜: 예전 말풍선은 표정별 고정 문구 3개(+넛지·환영)라 며칠 쓰면 전부 본 말이 됐다. 아트를 늘리지 않고도
 * 모찌가 살아 있다고 느끼게 하는 가장 싼 방법이 '오늘의 한마디'다. 같은 날·같은 시간대엔 같은 말
 * (새로고침마다 바뀌면 산만하다), 날짜와 시간대가 바뀌면 달라진다.
 *
 * 톤은 제안·다정함만(불변 #1) — "아직 안 먹었네요" 같은 지적 없음. 체중·칼로리 숫자 없음(불변 #2,
 * '잘 먹은 날' 일수는 홈 진행도 카드에 이미 있는 행동 카운트라 이정표에서만 말한다).
 * 우선순위(환호 > 가벼운 넛지 > 신규 환영)는 MochiRoom이 정하고, 그 밖의 평소 인사가 이 함수 몫이다.
 */

export interface SpeechContext {
  state: MochiState;
  /** 한국 시각 시(0~23) */
  hour: number;
  /** 한국 요일 (0=일 … 6=토) */
  weekday: number;
  /** 한국 날짜 번호(lib/kst kstDayNumber) */
  dayNumber: number;
  /** 잘 먹은 날 누적 */
  goodDays: number;
  /** 씨앗이 뽑기 비용만큼 모였는지 */
  canDraw: boolean;
}

/** 잘 먹은 날 이정표 — 딱 그날에만 축하한다. */
export const GOOD_DAY_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365] as const;

const MORNING = [
  "좋은 아침이에요. 오늘은 뭐 먹을까요? ☀️",
  "아침 한 입이면 하루가 든든해요 🍞",
  "일어났어요? 오늘도 같이 잘 먹어봐요 🌤️",
];
const LUNCH = [
  "점심 시간이에요! 가볍게 갈까요, 든든하게 갈까요? 🍱",
  "밖에서 먹는 점심이면 가벼운 메뉴부터 보여드릴게요 🥗",
  "점심 뭐 먹을지 모찌랑 골라봐요 🍚",
];
const AFTERNOON = [
  "오후엔 따뜻한 차 한 잔 어때요? 🍵",
  "출출하면 가볍게 한 입 챙겨요 🍎",
  "오늘 저녁은 뭐가 좋을까요? 미리 담아둬도 좋아요 🗓️",
];
const EVENING = [
  "저녁 뭐 먹을지 같이 볼까요? 🌙",
  "오늘도 수고했어요. 맛있는 저녁 먹어요 🍲",
  "냉장고에 있는 걸로 뚝딱 만들어볼까요? 🥕",
];
const HAPPY = [
  "오늘도 잘 먹었네요, 뿌듯해요 😊",
  "잘 챙겨 먹어줘서 모찌가 기뻐요 💛",
  "오늘 기록 고마워요. 모찌가 또 자랐어요 🌱",
];
const SLEEPY = [
  "쉬어가도 괜찮아요 😴",
  "오늘 하루도 수고했어요. 푹 자요 🌙",
  "모찌는 먼저 꿈나라 갈게요… 💤",
];
const WEEKEND = ["주말이에요! 천천히 맛있는 거 골라봐요 🌿", "느긋한 주말, 먹고 싶은 거 먹어요 🧺"];
const MONDAY = "월요일이에요. 이번 주 식단 한 번 볼까요? 🗓️";
const CAN_DRAW = "씨앗이 다 모였어요! 도감에서 새 모찌를 만나봐요 🎁";

/** 시간대 칸(0~3) — 같은 칸 안에서는 같은 말이 유지되게. */
function slotOf(hour: number): 0 | 1 | 2 | 3 {
  if (hour < 11) return 0;
  if (hour < 14) return 1;
  if (hour < 17) return 2;
  return 3;
}

function pick<T>(list: readonly T[], seed: number): T {
  return list[((seed % list.length) + list.length) % list.length];
}

export function mochiSpeech(ctx: SpeechContext): string {
  // 날짜마다 바뀌고 같은 날·같은 시간대엔 고정. (dayNumber*4로 두면 문구 4개짜리 목록에서 늘 같은 칸이 나온다)
  const seed = ctx.dayNumber + slotOf(ctx.hour) * 13;

  if (ctx.state === "sleepy") return pick(SLEEPY, ctx.dayNumber);

  // 이정표는 그날 하루 동안 — 가장 기쁜 소식이라 먼저
  if ((GOOD_DAY_MILESTONES as readonly number[]).includes(ctx.goodDays)) {
    return `잘 먹은 날이 벌써 ${ctx.goodDays}일이에요! 모찌가 자랑스러워요 🌱`;
  }

  const lines: string[] = [];
  if (ctx.state === "happy") {
    lines.push(...HAPPY);
  } else {
    const byTime = [MORNING, LUNCH, AFTERNOON, EVENING][slotOf(ctx.hour)];
    lines.push(...byTime);
    const weekend = ctx.weekday === 0 || ctx.weekday === 6;
    if (weekend && ctx.hour >= 9) lines.push(...WEEKEND);
    if (ctx.weekday === 1 && ctx.hour < 14) lines.push(MONDAY);
  }
  // 뽑기는 권유 한 줄로 섞기만 — 매번 재촉하지 않게
  if (ctx.canDraw) lines.push(CAN_DRAW);

  return pick(lines, seed);
}

/** 테스트용 — 모든 문구(이정표 제외) */
export const ALL_SPEECH_LINES: readonly string[] = [
  ...MORNING,
  ...LUNCH,
  ...AFTERNOON,
  ...EVENING,
  ...HAPPY,
  ...SLEEPY,
  ...WEEKEND,
  MONDAY,
  CAN_DRAW,
];
