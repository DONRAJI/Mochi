import { deleteAccount } from "@/server/services/auth.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** DELETE /api/auth/account — 계정 탈퇴(되돌릴 수 없음). 인증 필수. Google Play 정책 요구. */
export async function DELETE() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    await deleteAccount(userId);
    return ok({ done: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
