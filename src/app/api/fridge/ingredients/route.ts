import { ingredientQuerySchema, createIngredientSchema } from "@/features/fridge/types";
import { listIngredients, addIngredient } from "@/server/services/fridge.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/fridge/ingredients?page=&size=&category= — 본인 재료만 (소유자 스코프). */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const p = new URL(request.url).searchParams;
    const parsed = ingredientQuerySchema.safeParse({
      page: p.get("page") ?? undefined,
      size: p.get("size") ?? undefined,
      category: p.get("category") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const data = await listIngredients(userId, parsed.data.page, parsed.data.size, parsed.data.category);
    return ok(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** POST /api/fridge/ingredients — 재료 추가. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = createIngredientSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const data = await addIngredient(userId, parsed.data);
    return created(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
