import { nicknameSchema } from "@/features/auth/types";
import { setNickname } from "@/server/services/auth.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** PUT /api/auth/nickname — 닉네임 변경 (설정). 인증 필수. */
export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = nicknameSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await setNickname(userId, parsed.data.nickname));
  } catch (error) {
    return toErrorResponse(error);
  }
}
