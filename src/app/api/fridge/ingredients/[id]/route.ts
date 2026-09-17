import { moveIngredient, removeIngredient } from "@/server/services/fridge.service";
import { moveIngredientSchema } from "@/features/fridge/types";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** PATCH /api/fridge/ingredients/{id} — 냉장 ↔ 냉동 옮기기(보관 기한 재추정). 본인 재료만. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = moveIngredientSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const { id } = await params;
    return ok(await moveIngredient(userId, id, parsed.data.storage));
  } catch (error) {
    return toErrorResponse(error);
  }
}

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
