import { eatPlan } from "@/server/services/plan.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** POST /api/recommend/plan/{id}/eat — 계획한 끼니를 '먹었어요'(기록 루프 연동). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const { id } = await params;
    return ok(await eatPlan(userId, id));
  } catch (error) {
    return toErrorResponse(error);
  }
}
