import { markMealEaten } from "@/server/services/record.service";
import { uploadMealPhoto } from "@/server/storage/photo-storage";
import { getSessionUserId } from "@/server/auth/session";
import { created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { rateLimit } from "@/server/auth/rate-limit";

const MODES = new Set(["cook", "eatout", "convenience"]);

/**
 * POST /api/records/photo — 사진 한 장으로 기록 (PRD 8-3, 비요리 사용자용).
 * multipart/form-data: photo(파일) + mode(선택, 기본 eatout).
 * 서버가 타입·크기 검증 후 스토리지 업로드 → 기록 루프(스트릭·모찌 cheer). 인증 필수.
 */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    // 업로드는 민감 엔드포인트 — 유저당 분당 제한(security.md §5).
    if (!rateLimit(`photo:${userId}`, 20, 60_000)) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("photo");
    if (!(file instanceof Blob) || file.size === 0) {
      return fail("VALIDATION", "사진을 한 장 골라주세요.", 400);
    }
    const modeRaw = String(form?.get("mode") ?? "eatout");
    const mode = (MODES.has(modeRaw) ? modeRaw : "eatout") as "cook" | "eatout" | "convenience";

    const path = await uploadMealPhoto(userId, await file.arrayBuffer(), file.type);
    const result = await markMealEaten(userId, { mode, rarity: "common" }, path);
    return created(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
