import { displayCardSchema } from "@/features/mochi/types";
import { setDisplayCard } from "@/server/services/mochi.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * PUT /api/mochi/display-card — 홈 '모찌의 방'에 둘 카드 지정. 인증 필수.
 * cardId: null이면 방에서 내린다. 보유 검증은 서비스가 한다.
 */
export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = displayCardSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    await setDisplayCard(userId, parsed.data.cardId);
    return ok({ done: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
