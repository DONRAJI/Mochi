import { markMealSchema } from "@/features/record/types";
import { markMealEaten } from "@/server/services/record.service";
import { getSessionUserId } from "@/server/auth/session";
import { created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** POST /api/records/meals — '먹었어요' 체크 (기록 + 도감 + 스트릭 + 모찌). 인증 필수. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = markMealSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const data = await markMealEaten(userId, parsed.data);
    return created(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
