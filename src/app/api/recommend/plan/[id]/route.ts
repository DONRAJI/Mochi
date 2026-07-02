import { removePlan } from "@/server/services/plan.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** DELETE /api/recommend/plan/{id} — 계획 삭제(소유자 검증은 서비스에서). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const { id } = await params;
    await removePlan(userId, id);
    return ok({ done: true } as const);
  } catch (error) {
    return toErrorResponse(error);
  }
}
