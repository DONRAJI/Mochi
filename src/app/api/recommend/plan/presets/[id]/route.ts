import { removePreset } from "@/server/services/plan.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** DELETE /api/recommend/plan/presets/{id} — 프리셋 삭제. 소유자만. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    const { id } = await params;
    await removePreset(userId, id);
    return ok({ done: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
