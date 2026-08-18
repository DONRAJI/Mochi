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

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
});

export type PushSubscribeRequest = z.infer<typeof pushSubscribeSchema>;

export interface PushKeyResponse {
  /** VAPID 공개키(base64url). 서버 미구성이면 null — UI는 알림 섹션을 숨긴다. */
  key: string | null;
}
