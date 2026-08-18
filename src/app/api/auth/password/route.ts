import { changePasswordSchema } from "@/features/auth/types";
import { changePassword } from "@/server/services/auth.service";
import { getSessionUserId } from "@/server/auth/session";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * PUT /api/auth/password — 로그인 상태에서 비밀번호 변경 (설정). 인증 필수.
 * 현재 비밀번호를 확인하므로, 무차별 대입을 막으려 유저 기준 레이트 리밋을 건다.
 */
export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    if (!(await checkRateLimit(`pwchange:${userId}`, 5, 10 * 60 * 1000))) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    await changePassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
    return ok({ done: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
