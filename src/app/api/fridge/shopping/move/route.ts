import { moveCheckedToFridge } from "@/server/services/shopping.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** POST /api/fridge/shopping/move — 체크한 항목을 냉장고로 옮긴다(샀으니까). */
export async function POST() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await moveCheckedToFridge(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
