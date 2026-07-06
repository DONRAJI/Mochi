import { movePlan, removePlan } from "@/server/services/plan.service";
import { movePlanSchema } from "@/features/recommend/plan";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** PATCH /api/recommend/plan/{id} — 계획 이동(드래그 재배치). 다른 날짜/끼니로. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = movePlanSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const { id } = await params;
    return ok(await movePlan(userId, id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

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
