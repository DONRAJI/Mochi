import { savePresetSchema } from "@/features/recommend/preset";
import { listPresets, savePreset } from "@/server/services/plan.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** GET /api/recommend/plan/presets — 내 주간 프리셋 목록. 인증 필수. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await listPresets(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** POST /api/recommend/plan/presets — 그 주의 계획을 프리셋으로 저장. 인증 필수. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = savePresetSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }
    return ok(await savePreset(userId, parsed.data), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
