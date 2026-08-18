import { forgotPasswordSchema } from "@/features/auth/types";
import { requestPasswordReset } from "@/server/services/auth.service";
import { checkRateLimit, clientIp } from "@/server/auth/rate-limit";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * POST /api/auth/password/forgot — 재설정 메일 요청.
 *
 * ⚠️ **계정이 있든 없든 똑같이 성공을 반환한다.** 응답이 갈리면 "이 이메일이 가입돼 있는지"를
 * 알려주는 계정 확인 도구가 된다(사용자 열거). 검증 실패만 400으로 돌려준다.
 * 남의 메일함으로 스팸을 보내는 걸 막으려고 이메일·IP 양쪽으로 레이트 리밋을 건다.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const email = parsed.data.email.toLowerCase();
    const hour = 60 * 60 * 1000;
    const perEmail = await checkRateLimit(`forgot:${email}`, 3, hour);
    const perIp = await checkRateLimit(`forgot-ip:${clientIp(request)}`, 10, hour);
    if (!perEmail || !perIp) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    await requestPasswordReset(email);
    return ok({ sent: true }); // 계정 유무와 무관하게 동일 응답
  } catch (error) {
    return toErrorResponse(error);
  }
}
