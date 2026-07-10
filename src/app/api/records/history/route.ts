import { historyQuerySchema } from "@/features/record/types";
import { listMealHistory } from "@/server/services/record.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/records/history?month=&page=&size= — 월별 식사·체중 회고(달 안에서 페이지). 인증 필수. */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const params = new URL(request.url).searchParams;
    const parsed = historyQuerySchema.safeParse({
      month: params.get("month") ?? undefined,
      page: params.get("page") ?? undefined,
      size: params.get("size") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const data = await listMealHistory(userId, parsed.data);
    return ok(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
