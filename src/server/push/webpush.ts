import "server-only";
import { createPrivateKey, sign } from "node:crypto";

/**
 * 웹푸시 발송 — VAPID(RFC 8292) 서명을 Node 내장 crypto로 직접. **새 의존성 0**
 * (Brevo·Upstash·Supabase Storage와 같은 REST 패턴).
 *
 * **페이로드 없는 푸시**를 쓴다: 페이로드를 실으려면 RFC 8291 암호화(ECDH+HKDF+AES-GCM)가
 * 필요해 구현 표면이 크게 늘고, 리마인더는 내용이 정해져 있어 실을 것도 없다. 서버는
 * "깨워라"만 보내고, 문구는 기기의 서비스 워커가 그 시각에 맞게 정한다(public/sw.js).
 *
 * env: VAPID_PUBLIC_KEY(65B 비압축 P-256, base64url) · VAPID_PRIVATE_KEY(d 32B, base64url)
 *      · VAPID_SUBJECT(mailto:, 없으면 MAIL_FROM 폴백). 생성: npx tsx scripts/generate-vapid.ts
 */
const PUB = process.env.VAPID_PUBLIC_KEY?.trim();
const PRIV = process.env.VAPID_PRIVATE_KEY?.trim();
const SUBJECT =
  process.env.VAPID_SUBJECT?.trim() ||
  (process.env.MAIL_FROM ? `mailto:${process.env.MAIL_FROM.trim()}` : null);

export function pushConfigured(): boolean {
  return !!(PUB && PRIV && SUBJECT);
}

/** 클라 구독(applicationServerKey)에 줄 공개키. 미구성이면 null — UI는 섹션을 숨긴다. */
export function vapidPublicKey(): string | null {
  return pushConfigured() ? (PUB as string) : null;
}

/** env엔 공개키(x,y)와 개인키(d)를 따로 두므로 JWK로 합쳐 서명키를 만든다. */
function privateKey() {
  const raw = Buffer.from(PUB as string, "base64url"); // 0x04 || x(32) || y(32)
  return createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: raw.subarray(1, 33).toString("base64url"),
      y: raw.subarray(33, 65).toString("base64url"),
      d: PRIV as string,
    },
    format: "jwk",
  });
}

/** VAPID JWT (ES256). JWT 서명은 DER이 아니라 r||s 64바이트여야 한다(ieee-p1363). */
function vapidJwt(audience: string): string {
  const b64 = (s: object) => Buffer.from(JSON.stringify(s)).toString("base64url");
  const data = `${b64({ typ: "JWT", alg: "ES256" })}.${b64({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: SUBJECT,
  })}`;
  const sig = sign("sha256", Buffer.from(data), {
    key: privateKey(),
    dsaEncoding: "ieee-p1363",
  });
  return `${data}.${sig.toString("base64url")}`;
}

export type PushSendResult = "ok" | "gone" | "error";

/**
 * 구독 endpoint로 페이로드 없는 푸시 1건. "gone"(404/410)이면 구독이 죽은 것 —
 * 호출한 쪽이 DB에서 지워야 한다(앱 삭제·권한 회수 후 남은 좀비 구독 정리).
 */
export async function sendPush(endpoint: string): Promise<PushSendResult> {
  if (!pushConfigured()) return "error";
  try {
    const audience = new URL(endpoint).origin;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${vapidJwt(audience)}, k=${PUB}`,
        TTL: "14400", // 4시간 — 기기가 꺼져 있으면 그 안에만 전달(저녁 리마인더가 새벽에 오면 안 됨)
        Urgency: "normal",
      },
    });
    if (res.status === 404 || res.status === 410) return "gone";
    if (!res.ok) {
      console.error(`[push] 발송 실패 ${res.status}: ${await res.text().catch(() => "")}`);
      return "error";
    }
    return "ok";
  } catch (error) {
    console.error("[push] 발송 중 예외", error);
    return "error";
  }
}
