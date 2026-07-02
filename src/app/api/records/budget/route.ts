import { getDailyBudget } from "@/server/services/record.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/records/budget — 오늘의 kcal 예산(TDEE). detail 모드 + 프로필 완비 시만. 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await getDailyBudget(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
