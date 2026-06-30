import { getMe } from "@/server/services/auth.service";
import { ok, toErrorResponse } from "@/lib/api-response";

/** GET /api/auth/me — 현재 로그인 유저. 미인증이면 401 ApiResponse. */
export async function GET() {
  try {
    const user = await getMe();
    return ok(user);
  } catch (error) {
    return toErrorResponse(error);
  }
}
