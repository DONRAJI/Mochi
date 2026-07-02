import { toggleShopping, removeShopping } from "@/server/services/shopping.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** PATCH /api/fridge/shopping/{id} — 체크 토글. 소유자 검증은 서비스에서. */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    const { id } = await params;
    await toggleShopping(userId, id);
    return ok({ done: true } as const);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** DELETE /api/fridge/shopping/{id} — 리스트에서 제거. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    const { id } = await params;
    await removeShopping(userId, id);
    return ok({ done: true } as const);
  } catch (error) {
    return toErrorResponse(error);
  }
}
