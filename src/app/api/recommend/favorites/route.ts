import { toggleFavoriteSchema } from "@/features/recommend/favorite";
import { listFavorites, toggleFavorite } from "@/server/services/favorite.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/recommend/favorites — 내 즐겨찾기 목록 (#7). 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await listFavorites(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** POST /api/recommend/favorites — 하트 토글(추가/제거). */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = toggleFavoriteSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await toggleFavorite(userId, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
