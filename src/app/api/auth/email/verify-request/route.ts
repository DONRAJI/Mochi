import { resendVerification } from "@/server/services/auth.service";
import { getSessionUserId } from "@/server/auth/session";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * POST /api/auth/email/verify-request — 인증 메일 다시 보내기 (설정). 인증 필수.
 * 이미 인증한 계정이면 서비스가 조용히 아무것도 하지 않는다(멱등).
 */
export async function POST() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    if (!(await checkRateLimit(`verify-send:${userId}`, 3, 60 * 60 * 1000))) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    await resendVerification(userId);
    return ok({ sent: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
