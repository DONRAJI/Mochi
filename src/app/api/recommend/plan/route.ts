import { addPlanSchema, planRangeSchema } from "@/features/recommend/plan";
import { listPlan, addPlan } from "@/server/services/plan.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/recommend/plan?from=YYYY-MM-DD&to=YYYY-MM-DD — 주간 계획. 인증 필수. */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const params = new URL(request.url).searchParams;
    const parsed = planRangeSchema.safeParse({ from: params.get("from"), to: params.get("to") });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return ok(await listPlan(userId, parsed.data.from, parsed.data.to));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** POST /api/recommend/plan — 한 끼 담기. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = addPlanSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    return created(await addPlan(userId, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
