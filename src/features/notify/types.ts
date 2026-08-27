import { z } from "zod";

/**
 * notify — 리마인더 푸시 구독 (작은 보조 도메인).
 * 6대 도메인 밖이지만 어디에도 자연스럽게 속하지 않아 분리: 알림은 record(기록)를 돕는
 * 크로스컷 기능이고, 서버 짝은 push.service. UI 진입은 설정(마이 > 설정 > 알림).
 */
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});

/**
 * 웹푸시 해지. `endpoint`가 있으면 그 구독 하나만, **없으면 내 웹 구독 전부**를 해지한다.
 * 전부 해지는 앱(네이티브 셸)이 리마인더 채널을 가져갈 때 쓴다 — 앱은 브라우저의 구독
 * endpoint를 알 수 없으므로 계정 기준으로 지워달라고 요청할 길이 있어야 한다.
 */
export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(1000).optional(),
});

/** 네이티브(FCM) 토큰 등록 — Capacitor 셸에서. 토큰은 FCM registration token(불투명 문자열). */
export const deviceTokenSchema = z.object({
  token: z.string().min(10).max(4096),
  platform: z.enum(["android", "ios"]).default("android"),
});

export const deviceTokenDeleteSchema = z.object({
  token: z.string().min(10).max(4096),
});

export type DeviceTokenRequest = z.infer<typeof deviceTokenSchema>;

export type PushSubscribeRequest = z.infer<typeof pushSubscribeSchema>;

export interface PushKeyResponse {
  /** VAPID 공개키(base64url). 서버 미구성이면 null — UI는 알림 섹션을 숨긴다. */
  key: string | null;
}
