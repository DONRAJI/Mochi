import { drawMochiCard } from "@/server/services/collection.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { checkRateLimit } from "@/server/auth/rate-limit";

/** POST /api/collection/draw — 모찌 카드 1회 뽑기(씨앗 차감). 인증 필수. */
export async function POST() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    // 뽑기 남용 방지 — 유저당 분당 제한(security.md §5).
    if (!(await checkRateLimit(`draw:${userId}`, 30, 60_000))) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }
    return ok(await drawMochiCard(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
