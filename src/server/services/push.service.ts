import "server-only";
import { db } from "@/server/db";
import { sendPush } from "@/server/push/webpush";
import { sendFcm } from "@/server/push/fcm";

/**
 * push 서비스 — 리마인더 구독 관리 + 저녁 리마인더 발송 (비즈니스 로직·Prisma는 여기서만).
 * 철학(불변 #1): 리마인더는 재촉이 아니라 **제안**이다. "기록 안 했잖아"가 아니라
 * "저녁 뭐 먹을지 같이 볼까요" — 그래서 이미 저녁을 기록한 사람에겐 아예 보내지 않는다.
 */

interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** 구독 저장 — endpoint가 기기 고유라, 같은 기기로 다른 계정 로그인 시 주인을 갈아탄다. */
export async function saveSubscription(userId: string, sub: SubscriptionInput): Promise<void> {
  await db.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    update: { userId, p256dh: sub.p256dh, auth: sub.auth },
  });
}

/** 구독 해지 — 소유자 검증(security.md §4): 내 구독만 지울 수 있다. */
export async function removeSubscription(userId: string, endpoint: string): Promise<void> {
  await db.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

/** 네이티브(FCM) 토큰 저장 — 같은 기기로 다른 계정 로그인 시 주인을 갈아탄다(웹 구독과 동일 규칙). */
export async function saveDeviceToken(
  userId: string,
  token: string,
  platform: string,
): Promise<void> {
  await db.deviceToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform },
  });
}

/** 네이티브 토큰 해지 — 소유자 검증: 내 토큰만 지울 수 있다. */
export async function removeDeviceToken(userId: string, token: string): Promise<void> {
  await db.deviceToken.deleteMany({ where: { token, userId } });
}

/** KST 자정의 UTC 순간 (record.service와 같은 계산 — 서버가 UTC라도 한국의 '오늘'). */
function kstDayStart(nowMs = Date.now()): Date {
  const KST = 9 * 3_600_000;
  const shifted = nowMs + KST;
  return new Date(shifted - (shifted % 86_400_000) - KST);
}

export interface ReminderRunResult {
  sent: number;
  skipped: number; // 오늘 저녁을 이미 기록한 사람 — 제안할 게 없어 보내지 않음
  stale: number; // 죽은 구독(404/410) 정리 수
}

/** 저녁 리마인더 문구 — FCM(네이티브)은 서버가 내용을 싣는다. 웹푸시 쪽 문구는 sw.js에. */
const REMINDER_TITLE = "모찌";
const REMINDER_BODY = "오늘 저녁 뭐 먹을지, 모찌가 골라놨어요 🍽️";
const REMINDER_URL = "/meals";

/**
 * 저녁 리마인더 1회 실행 (Vercel Cron이 KST 18:30에 호출).
 * 대상 = 웹푸시 구독(브라우저) + FCM 토큰(Capacitor 앱), 단 **오늘 저녁을 이미 기록한
 * 사람은 제외**(재촉 아님 — 불변 #1). 같은 유저가 앱·브라우저 양쪽에 등록돼 있으면
 * **앱으로만** 보낸다(중복 알림 방지). 죽은 구독/토큰은 그 자리에서 정리.
 */
export async function sendDinnerReminders(): Promise<ReminderRunResult> {
  const [subs, devices] = await Promise.all([
    db.pushSubscription.findMany(),
    // device_tokens 마이그레이션 전에 이 코드가 먼저 배포돼도 웹푸시는 계속 가야 한다.
    db.deviceToken.findMany().catch(() => []),
  ]);
  if (subs.length === 0 && devices.length === 0) return { sent: 0, skipped: 0, stale: 0 };

  const userIds = [...new Set([...subs.map((s) => s.userId), ...devices.map((d) => d.userId)])];
  const eaten = await db.mealRecord.findMany({
    where: { userId: { in: userIds }, slot: "dinner", eatenAt: { gte: kstDayStart() } },
    select: { userId: true },
  });
  const ateDinner = new Set(eaten.map((e) => e.userId));
  const nativeUsers = new Set(devices.map((d) => d.userId));

  const result: ReminderRunResult = { sent: 0, skipped: 0, stale: 0 };

  for (const device of devices) {
    if (ateDinner.has(device.userId)) {
      result.skipped += 1;
      continue;
    }
    const r = await sendFcm(device.token, REMINDER_TITLE, REMINDER_BODY, REMINDER_URL);
    if (r === "gone") {
      await db.deviceToken.delete({ where: { id: device.id } }).catch(() => {});
      result.stale += 1;
    } else if (r === "ok") {
      result.sent += 1;
    }
  }

  for (const sub of subs) {
    // 앱에서도 등록한 유저 — 네이티브로 이미 갔으니 웹으로 또 보내지 않는다.
    if (ateDinner.has(sub.userId) || nativeUsers.has(sub.userId)) {
      result.skipped += 1;
      continue;
    }
    const r = await sendPush(sub.endpoint);
    if (r === "gone") {
      await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      result.stale += 1;
    } else if (r === "ok") {
      result.sent += 1;
    }
  }
  return result;
}
