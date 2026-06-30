import { collectionQuerySchema } from "@/features/collection/types";
import { listCollection } from "@/server/services/collection.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/collection?type=recipe|ingredient|convenience — 내 도감(획득 여부 포함). 인증 필수. */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const type = new URL(request.url).searchParams.get("type");
    const parsed = collectionQuerySchema.safeParse({ type });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const data = await listCollection(userId, parsed.data.type);
    return ok(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
