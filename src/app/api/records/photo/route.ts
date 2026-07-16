import { markMealEaten } from "@/server/services/record.service";
import { uploadMealPhoto } from "@/server/storage/photo-storage";
import { getSessionUserId } from "@/server/auth/session";
import { created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { checkRateLimit } from "@/server/auth/rate-limit";

const MODES = new Set(["cook", "eatout", "convenience"]);
const SLOTS = new Set(["breakfast", "lunch", "dinner", "snack"]);
const RARITIES = new Set(["common", "rare", "epic", "seasonal"]);

/**
 * POST /api/records/photo — 사진 한 장으로 기록 (PRD 8-3).
 * multipart/form-data: photo(파일) + mode(선택, 기본 eatout) + refId·slot·rarity(선택).
 * refId를 주면 특정 레시피에 사진을 붙인 기록이 됨(내 사진이 그 레시피 카드에 표시, B안).
 * 서버가 타입·크기 검증 후 스토리지 업로드 → 기록 루프(스트릭·모찌 cheer). 인증 필수.
 */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    // 업로드는 민감 엔드포인트 — 유저당 분당 제한(security.md §5).
    if (!(await checkRateLimit(`photo:${userId}`, 20, 60_000))) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("photo");
    if (!(file instanceof Blob) || file.size === 0) {
      return fail("VALIDATION", "사진을 한 장 골라주세요.", 400);
    }
    const modeRaw = String(form?.get("mode") ?? "eatout");
    const mode = (MODES.has(modeRaw) ? modeRaw : "eatout") as "cook" | "eatout" | "convenience";
    const slotRaw = String(form?.get("slot") ?? "");
    const slot = SLOTS.has(slotRaw)
      ? (slotRaw as "breakfast" | "lunch" | "dinner" | "snack")
      : undefined;
    const refIdRaw = String(form?.get("refId") ?? "");
    const refId = refIdRaw.length > 0 && refIdRaw.length <= 60 ? refIdRaw : undefined;
    const rarityRaw = String(form?.get("rarity") ?? "common");
    const rarity = (RARITIES.has(rarityRaw) ? rarityRaw : "common") as
      | "common"
      | "rare"
      | "epic"
      | "seasonal";

    const path = await uploadMealPhoto(userId, await file.arrayBuffer());
    const result = await markMealEaten(userId, { mode, slot, refId, rarity }, path);
    return created(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
