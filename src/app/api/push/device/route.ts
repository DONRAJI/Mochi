import { deviceTokenSchema, deviceTokenDeleteSchema } from "@/features/notify/types";
import { saveDeviceToken, removeDeviceToken } from "@/server/services/push.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** POST /api/push/device — 네이티브(FCM) 푸시 토큰 등록 (Capacitor 셸). 인증 필수. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = deviceTokenSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    await saveDeviceToken(userId, parsed.data.token, parsed.data.platform);
    return ok({ done: true }, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** DELETE /api/push/device — 네이티브 푸시 토큰 해지 (알림 끄기·로그아웃 시). 인증 필수. */
export async function DELETE(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = deviceTokenDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    await removeDeviceToken(userId, parsed.data.token);
    return ok({ done: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
