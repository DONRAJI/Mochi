import { applyPresetSchema } from "@/features/recommend/preset";
import { applyPreset } from "@/server/services/plan.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * POST /api/recommend/plan/presets/{id}/apply — 프리셋을 그 주에 적용. 소유자만.
 * 빈 자리만 채우고, 몇 개 담았는지·건너뛰었는지 돌려준다.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = applyPresetSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }
    const { id } = await params;
    return ok(await applyPreset(userId, id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
