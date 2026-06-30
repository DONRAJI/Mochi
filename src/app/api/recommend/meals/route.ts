import { recommendQuerySchema } from "@/features/recommend/types";
import { getRecommendations } from "@/server/services/recommend.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * GET /api/recommend/meals?mode=cook|eatout|convenience&page=&size=
 * 로그인 없이도 동작(공개 시드 카탈로그). 로그인 시 요리 모드 매칭률이 냉장고 기준으로 계산됨.
 */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const parsed = recommendQuerySchema.safeParse({
      mode: params.get("mode"),
      page: params.get("page") ?? undefined,
      size: params.get("size") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const userId = await getSessionUserId();
    const data = await getRecommendations(parsed.data.mode, userId, parsed.data.page, parsed.data.size);
    return ok(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
