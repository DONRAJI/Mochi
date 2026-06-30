import { removeIngredient } from "@/server/services/fridge.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** DELETE /api/fridge/ingredients/{id} — 본인 재료만 삭제(소유자 검증은 서비스에서). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const { id } = await params;
    await removeIngredient(userId, id);
    return ok({ done: true } as const);
  } catch (error) {
    return toErrorResponse(error);
  }
}
