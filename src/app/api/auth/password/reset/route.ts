import { resetPasswordSchema } from "@/features/auth/types";
import { resetPassword } from "@/server/services/auth.service";
import { checkRateLimit, clientIp } from "@/server/auth/rate-limit";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * POST /api/auth/password/reset — 메일 링크로 받은 토큰으로 새 비밀번호 설정.
 * 성공 시 서비스가 그 유저의 **모든 세션을 폐기**한다(계정 탈환 시나리오).
 * 토큰 대입 시도를 막으려고 IP 기준 레이트 리밋.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    if (!(await checkRateLimit(`reset-ip:${clientIp(request)}`, 10, 60 * 60 * 1000))) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    const done = await resetPassword(parsed.data.token, parsed.data.password);
    if (!done) {
      // 만료·이미 사용·잘못된 토큰을 구분해 알려주지 않는다(정보 유출 방지).
      return fail("VALIDATION", "이 링크는 이미 쓰였거나 오래됐어요. 다시 요청해 주세요.", 400);
    }
    return ok({ done: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
