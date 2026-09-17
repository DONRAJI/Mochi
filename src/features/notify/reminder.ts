import { daysUntil } from "@/features/fridge/expiry";

/**
 * 저녁 리마인더 문구 고르기 (순수) — 사용자마다, 날마다 다르게.
 *
 * 왜 설정이 아니라 자동인가(2026-09-17): 알림 시각을 고르게 하면 켜는 것 자체가 일이 되고, Vercel
 * Hobby 크론은 하루 한 번(KST 18:30)뿐이라 시각 선택은 구조상 어렵다. 대신 **내용**을 그 사람의 지금
 * 상황에서 고른다 — 매일 같은 문구는 며칠이면 안 읽힌다.
 *
 * 우선순위: ① 오늘 저녁으로 담아둔 계획(가장 바로 쓸 수 있는 제안) ② 그 밖의 신호(오늘·내일 유통기한
 * 재료, 뽑기 가능한 씨앗)와 기본 문구를 **날짜·사용자별로 돌려가며**. 톤은 재촉이 아니라 제안(불변 #1),
 * 숫자(체중·칼로리)는 싣지 않는다(불변 #2). 이미 저녁을 기록한 사람은 발송 전에 빠진다(push.service).
 */

export interface ReminderContext {
  /** 오늘 저녁(또는 끼니 미정)으로 담아두고 아직 안 먹은 계획의 이름 */
  plannedDinner: string | null;
  /** 오늘·내일 유통기한인 재료 이름(지난 건 권하지 않는다) */
  expiringIngredient: string | null;
  /** 씨앗이 뽑기 비용만큼 모였는지 */
  canDraw: boolean;
  /** 한국 날짜 번호(lib/kst kstDayNumber) — 날마다 문구가 바뀌게 */
  dayNumber: number;
  /** 사용자 식별자 — 같은 날에도 사람마다 다른 문구가 가게 */
  userKey: string;
}

export interface ReminderMessage {
  title: string;
  body: string;
  url: string;
}

const TITLE = "모찌";
const NAME_MAX = 20;

/** 이름이 길면 알림 한 줄이 잘리므로 적당히 줄인다. */
function shortName(name: string): string {
  const n = name.trim();
  return n.length > NAME_MAX ? `${n.slice(0, NAME_MAX)}…` : n;
}

/** 특별한 신호가 없을 때 돌려 쓰는 문구 — 요리하는 날·밖에서 먹는 날 모두에 맞게. */
export const REMINDER_POOL: readonly ReminderMessage[] = [
  { title: TITLE, body: "오늘 저녁 뭐 먹을지, 모찌가 골라놨어요 🍽️", url: "/meals" },
  {
    title: TITLE,
    body: "오늘도 수고했어요. 저녁은 가볍게? 든든하게? 같이 골라봐요 🌙",
    url: "/meals",
  },
  {
    title: TITLE,
    body: "밖에서 먹는 날이면 가벼운 메뉴부터 보여드릴게요 ☕",
    url: "/meals?segment=outside",
  },
  { title: TITLE, body: "저녁 한 끼 남기면 모찌가 또 한 뼘 자라요 🌱", url: "/meals" },
  { title: TITLE, body: "냉장고에 있는 걸로 만들 저녁, 모찌가 찾아놨어요 🥕", url: "/meals" },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function reminderMessage(ctx: ReminderContext): ReminderMessage {
  if (ctx.plannedDinner) {
    return {
      title: TITLE,
      body: `오늘 저녁은 '${shortName(ctx.plannedDinner)}' 담아뒀죠? 먹고 나면 모찌한테 알려줘요 🍽️`,
      url: "/meals?view=week",
    };
  }

  const seed = ctx.dayNumber + hash(ctx.userKey);
  const choices: ReminderMessage[] = [REMINDER_POOL[seed % REMINDER_POOL.length]];
  if (ctx.expiringIngredient) {
    choices.push({
      title: TITLE,
      body: `냉장고의 ${shortName(ctx.expiringIngredient)}, 오늘 저녁에 써볼까요? 🧊`,
      url: "/meals",
    });
  }
  if (ctx.canDraw) {
    choices.push({
      title: TITLE,
      body: "씨앗이 다 모였어요 🎁 저녁 기록하고 새 모찌를 만나봐요",
      url: "/meals",
    });
  }
  return choices[seed % choices.length];
}

/** 유통기한이 오늘·내일인 재료 중 가장 급한 것. 이미 지난 재료는 권하지 않는다. */
export function pickExpiringIngredient(
  items: { name: string; expiresAt: Date | null }[],
  now: Date,
): string | null {
  const soon = items
    .filter((i) => {
      const days = daysUntil(i.expiresAt, now);
      return days !== null && days >= 0 && days <= 1;
    })
    // 일 단위(daysUntil)로는 5시간 남은 것과 20시간 남은 것이 같은 '1일'이라 실제 시각으로 가른다.
    .sort((a, b) => (a.expiresAt?.getTime() ?? 0) - (b.expiresAt?.getTime() ?? 0));
  return soon[0]?.name ?? null;
}
