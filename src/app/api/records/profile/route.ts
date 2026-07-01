import { profileSchema } from "@/features/record/types";
import { getProfile, saveProfile } from "@/server/services/record.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/records/profile — 내 opt-in 프로필 (PRD 11.4). 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await getProfile(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** PUT /api/records/profile — 프로필 저장(upsert). 원하는 사람만. */
export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await saveProfile(userId, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
