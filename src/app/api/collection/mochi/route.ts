import { getMochiCollection } from "@/server/services/collection.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/collection/mochi — 모찌 뽑기 도감(카드 16 ⋈ 획득 + 씨앗). 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await getMochiCollection(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
