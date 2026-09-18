import { listFrequentMeals } from "@/server/services/record.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/records/frequent — 자주 먹은 것 몇 개(홈 '또 먹었어요' 한 번 탭 기록). 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await listFrequentMeals(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
