import { preferencesSchema } from "@/features/auth/types";
import { getPreferences, savePreferences } from "@/server/services/auth.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/auth/preferences — 내 취향(선호·비선호·알러지). 추천 반영용. 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await getPreferences(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** PUT /api/auth/preferences — 취향 통째 교체. */
export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await savePreferences(userId, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
