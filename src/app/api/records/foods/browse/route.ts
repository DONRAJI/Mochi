import { foodBrowseQuerySchema } from "@/features/record/types";
import { browseFoods } from "@/server/services/food.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * GET /api/records/foods/browse?place=cafe|bakery|fastfood|meal&page=&size=
 * — '밖에서 먹기' 장소별 음식 사전 목록(가벼운 순, 페이지, 최대 20). 인증 필수.
 */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const params = new URL(request.url).searchParams;
    const parsed = foodBrowseQuerySchema.safeParse({
      place: params.get("place") ?? undefined,
      page: params.get("page") ?? undefined,
      size: params.get("size") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const { place, page, size } = parsed.data;
    return ok(await browseFoods(userId, place, page, size));
  } catch (error) {
    return toErrorResponse(error);
  }
}
