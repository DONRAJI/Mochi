import { foodSearchQuerySchema } from "@/features/record/types";
import { searchFoods } from "@/server/services/food.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/records/foods?q=&size= — 음식 영양 사전 이름 검색(직접 입력 기록의 칼로리 제안). 인증 필수, 최대 10개. */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const params = new URL(request.url).searchParams;
    const parsed = foodSearchQuerySchema.safeParse({
      q: params.get("q") ?? undefined,
      size: params.get("size") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await searchFoods(userId, parsed.data.q, parsed.data.size));
  } catch (error) {
    return toErrorResponse(error);
  }
}
