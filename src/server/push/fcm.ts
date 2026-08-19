import "server-only";
import { createPrivateKey, sign, type KeyObject } from "node:crypto";

/**
 * FCM 네이티브 푸시 발송 — HTTP v1 API를 REST(fetch)로 직접. **새 의존성 0**
 * (firebase-admin SDK 대신 서비스계정 JWT를 node:crypto로 서명 — Brevo·VAPID와 같은 패턴).
 *
 * Capacitor 셸(안드로이드 앱) 사용자용. 웹푸시(webpush.ts)와 달리 페이로드(제목·본문)를
 * 서버가 싣는다 — FCM은 암호화 규격 부담이 없고, 네이티브 알림은 내용이 있어야 뜬다.
 *
 * env(서비스계정 JSON에서 복사): FCM_PROJECT_ID · FCM_CLIENT_EMAIL · FCM_PRIVATE_KEY.
 * 키가 없으면 발송을 건너뛴다(웹푸시처럼 기능 꺼짐 — 미구성 배포에도 안전).
 */
const PROJECT_ID = process.env.FCM_PROJECT_ID?.trim();
const CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL?.trim();
// Vercel 등은 PEM의 개행을 문자 그대로("\n") 저장하는 경우가 있어 둘 다 수용한다.
const PRIVATE_KEY = process.env.FCM_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");

export function fcmConfigured(): boolean {
  return !!(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);
}

let signingKey: KeyObject | null = null;
function key(): KeyObject {
  if (!signingKey) signingKey = createPrivateKey(PRIVATE_KEY as string);
  return signingKey;
}

/** OAuth 액세스 토큰 캐시 — 유효 1시간짜리를 매 발송마다 재발급하지 않게. */
let cached: { value: string; expiresAt: number } | null = null;

function b64url(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/** 서비스계정 JWT(RS256) → 구글 OAuth 토큰 교환. 실패 시 null(발송은 error로 귀결). */
async function accessToken(): Promise<string | null> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;

  const now = Math.floor(Date.now() / 1000);
  const data = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url({
    iss: CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const assertion = `${data}.${sign("sha256", Buffer.from(data), key()).toString("base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    console.error(`[fcm] 토큰 교환 실패 ${res.status}: ${await res.text().catch(() => "")}`);
    return null;
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export type FcmSendResult = "ok" | "gone" | "error";

/**
 * 알림 1건 발송. "gone"(404 = UNREGISTERED)이면 앱 삭제 등으로 토큰이 죽은 것 —
 * 호출한 쪽이 DB에서 지운다(webpush.ts의 구독 정리와 같은 계약).
 */
export async function sendFcm(
  token: string,
  title: string,
  body: string,
  url: string,
): Promise<FcmSendResult> {
  if (!fcmConfigured()) return "error";
  try {
    const bearer = await accessToken();
    if (!bearer) return "error";

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${bearer}`, "content-type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            // 탭 시 이동할 경로 — 셸의 pushNotificationActionPerformed 리스너가 읽는다(2단계).
            data: { url },
            android: { ttl: "14400s" }, // 웹푸시와 동일 4시간 — 저녁 리마인더가 새벽에 오면 안 됨
          },
        }),
      },
    );
    if (res.status === 404) return "gone"; // UNREGISTERED — 토큰 사망
    if (!res.ok) {
      console.error(`[fcm] 발송 실패 ${res.status}: ${await res.text().catch(() => "")}`);
      return "error";
    }
    return "ok";
  } catch (error) {
    console.error("[fcm] 발송 중 예외", error);
    return "error";
  }
}
