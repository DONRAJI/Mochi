import { autoFillSchema } from "@/features/recommend/plan";
import { autoFillWeek } from "@/server/services/plan.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** POST /api/recommend/plan/auto — 이번 주 빈 날 자동 채우기 (PRD 4.3). 인증 필수. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = autoFillSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await autoFillWeek(userId, parsed.data.dates));
  } catch (error) {
    return toErrorResponse(error);
  }
}
