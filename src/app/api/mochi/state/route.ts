import { ok, toErrorResponse } from "@/lib/api-response";
import { getMochiState } from "@/server/services/mochi.service";

/**
 * GET /api/mochi/state — 모찌 현재 상태.
 * Route Handler는 얇게: (검증 →) 서비스 호출 → ApiResponse 변환만 (structure.md).
 */
export async function GET() {
  try {
    const data = await getMochiState();
    return ok(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
