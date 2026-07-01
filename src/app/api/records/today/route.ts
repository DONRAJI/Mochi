import { listTodayMeals } from "@/server/services/record.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/records/today — 오늘(KST) 먹은 끼니 목록. 마이 '오늘의 기록' 스트립용. 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const data = await listTodayMeals(userId);
    return ok(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
