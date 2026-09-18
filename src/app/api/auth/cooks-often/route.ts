import { cooksOftenSchema } from "@/features/auth/types";
import { setCooksOften } from "@/server/services/auth.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** PUT /api/auth/cooks-often — 요리 성향 변경(가입 때 고른 값을 나중에 바꾸기). 인증 필수. */
export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = cooksOftenSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await setCooksOften(userId, parsed.data.cooksOften));
  } catch (error) {
    return toErrorResponse(error);
  }
}
