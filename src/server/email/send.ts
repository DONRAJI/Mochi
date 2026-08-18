import "server-only";

/**
 * 메일 발송 — Brevo Transactional API를 REST(fetch)로 호출. **새 의존성 0**
 * (Upstash 레이트리밋·Supabase Storage와 같은 패턴).
 *
 * Brevo를 고른 이유: 배포 도메인이 `*.vercel.app`이라 DNS 레코드를 넣을 수 없어 도메인 인증이
 * 불가능하다. Brevo는 **발신자 이메일 하나만 인증**하면 임의 수신자에게 보낼 수 있다.
 *
 * env: BREVO_API_KEY · MAIL_FROM(인증한 발신 주소) · MAIL_FROM_NAME(선택) · APP_URL(링크 기준).
 * 키가 없으면 **보내지 않고 서버 로그에 링크를 남긴다** — 제공자를 붙이기 전에도 흐름을 시험할 수 있다.
 */
const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim();
const MAIL_FROM = process.env.MAIL_FROM?.trim();
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME?.trim() || "모찌";

/** 메일 링크의 기준 주소. 배포에선 APP_URL을 넣는다(없으면 Vercel 주소 → 로컬 순). */
export function appUrl(): string {
  const explicit = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function mailConfigured(): boolean {
  return !!(BREVO_API_KEY && MAIL_FROM);
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** 미설정 폴백 로그에 남길 링크 — 개발 중 흐름 확인용. */
  devLink?: string;
}

/**
 * 실제 발송. **실패해도 던지지 않는다** — 가입·재설정 요청 흐름이 메일 장애로 막히면 안 되고,
 * 실패 사유를 응답으로 흘리면 계정 존재 여부가 드러난다(사용자 열거). 실패는 서버 로그로만.
 */
export async function sendEmail({ to, subject, html, devLink }: SendEmailInput): Promise<boolean> {
  if (!mailConfigured()) {
    // 제공자 미설정 — 링크를 서버 로그로. 프로덕션에서 이 로그가 보이면 env가 빠진 것.
    console.warn(`[mail] 미설정(BREVO_API_KEY·MAIL_FROM) → 발송 생략: ${subject} → ${to}`);
    if (devLink) console.warn(`[mail] 링크: ${devLink}`);
    return false;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY as string,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: MAIL_FROM_NAME, email: MAIL_FROM },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      console.error(`[mail] 발송 실패 ${res.status}: ${await res.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[mail] 발송 중 예외", error);
    return false;
  }
}
