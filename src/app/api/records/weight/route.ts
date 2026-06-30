import { createWeightSchema, weightQuerySchema } from "@/features/record/types";
import { addWeight, listWeights } from "@/server/services/record.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/records/weight?size= — 내 체중 기록(과거→현재). 인증 필수. */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const parsed = weightQuerySchema.safeParse({
      size: new URL(request.url).searchParams.get("size") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const data = await listWeights(userId, parsed.data.size);
    return ok(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** POST /api/records/weight — 체중 기록. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = createWeightSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const data = await addWeight(userId, parsed.data.weight, parsed.data.loggedAt);
    return created(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
