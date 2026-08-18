import { sendDinnerReminders } from "@/server/services/push.service";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * GET /api/push/cron — 저녁 리마인더 발송 (vercel.json crons가 KST 18:30에 호출).
 * Vercel은 CRON_SECRET env가 있으면 `Authorization: Bearer <secret>`을 자동으로 붙인다 —
 * 그걸 검증해 외부인이 임의로 발송을 트리거하지 못하게 한다. 시크릿 미설정이면 실행 거부
 * (아무나 두드릴 수 있는 상태로 여는 것보다 꺼져 있는 게 낫다).
 */
export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) return fail("INTERNAL", messages.error.INTERNAL, 503);
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return fail("FORBIDDEN", messages.error.FORBIDDEN, 403);
    }

    return ok(await sendDinnerReminders());
  } catch (error) {
    return toErrorResponse(error);
  }
}
