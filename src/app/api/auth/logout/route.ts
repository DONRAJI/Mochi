import { logout } from "@/server/services/auth.service";
import { ok, toErrorResponse } from "@/lib/api-response";

/** POST /api/auth/logout — 세션 삭제 + 쿠키 제거. */
export async function POST() {
  try {
    await logout();
    return ok({ done: true } as const);
  } catch (error) {
    return toErrorResponse(error);
  }
}
