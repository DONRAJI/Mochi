import { ok, toErrorResponse } from "@/lib/api-response";
import { getMochiState } from "@/server/services/mochi.service";
import { getSessionUserId } from "@/server/auth/session";

/** GET /api/mochi/state — 모찌 현재 상태/성장. 로그인 시 오늘 먹음·수집 수 반영. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    const data = await getMochiState(userId);
    return ok(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
