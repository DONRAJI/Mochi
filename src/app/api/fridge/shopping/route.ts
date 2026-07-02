import { addShoppingSchema } from "@/features/fridge/shopping";
import { listShopping, addShopping } from "@/server/services/shopping.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/fridge/shopping — 내 장보기 리스트. 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await listShopping(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** POST /api/fridge/shopping — 재료 여러 개 담기(추가구매에서 한 번에). */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = addShoppingSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return created(await addShopping(userId, parsed.data.names));
  } catch (error) {
    return toErrorResponse(error);
  }
}
