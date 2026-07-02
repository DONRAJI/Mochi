import { displayModeSchema } from "@/features/auth/types";
import { setDisplayMode } from "@/server/services/auth.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** PUT /api/auth/display-mode — 숫자 표시 모드 변경 (#4). 인증 필수. */
export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = displayModeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await setDisplayMode(userId, parsed.data.displayMode));
  } catch (error) {
    return toErrorResponse(error);
  }
}
