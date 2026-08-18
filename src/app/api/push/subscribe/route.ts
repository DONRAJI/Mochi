import { pushSubscribeSchema, pushUnsubscribeSchema } from "@/features/notify/types";
import { saveSubscription, removeSubscription } from "@/server/services/push.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** POST /api/push/subscribe — 리마인더 구독 등록 (설정에서 켬). 인증 필수. */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = pushSubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    await saveSubscription(userId, {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    });
    return ok({ done: true }, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** DELETE /api/push/subscribe — 리마인더 구독 해지 (설정에서 끔). 인증 필수. */
export async function DELETE(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);

    const body = await request.json().catch(() => null);
    const parsed = pushUnsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    await removeSubscription(userId, parsed.data.endpoint);
    return ok({ done: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
