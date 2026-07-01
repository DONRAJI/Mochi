import { getBalanceNudge } from "@/server/services/record.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/records/nudge — 오늘의 밸런싱 제안 (PRD 11.5). 홈 말풍선용. 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await getBalanceNudge(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
