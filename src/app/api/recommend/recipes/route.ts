import { createRecipeSchema } from "@/features/recommend/types";
import { createUserRecipe } from "@/server/services/recommend.service";
import { getSessionUserId } from "@/server/auth/session";
import { created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** POST /api/recommend/recipes — 내 요리 등록 (PRD 11.3). 인증 필수. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = createRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const data = await createUserRecipe(userId, parsed.data);
    return created(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
