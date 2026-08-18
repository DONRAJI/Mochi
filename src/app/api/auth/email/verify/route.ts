import { verifyEmailSchema } from "@/features/auth/types";
import { verifyEmail } from "@/server/services/auth.service";
import { checkRateLimit, clientIp } from "@/server/auth/rate-limit";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * POST /api/auth/email/verify — 메일 링크의 토큰으로 이메일 인증 완료.
 * 로그인 없이도 호출된다(메일을 다른 기기에서 열 수 있으므로) — 토큰 자체가 증명.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    if (!(await checkRateLimit(`verify-ip:${clientIp(request)}`, 20, 60 * 60 * 1000))) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    const done = await verifyEmail(parsed.data.token);
    if (!done) {
      return fail("VALIDATION", "이 링크는 이미 쓰였거나 오래됐어요. 다시 보내볼까요?", 400);
    }
    return ok({ done: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
