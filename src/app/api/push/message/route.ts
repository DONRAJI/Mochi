import { getReminderMessage } from "@/server/services/push.service";
import { getSessionUserId } from "@/server/auth/session";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/**
 * GET /api/push/message — 웹푸시를 받은 서비스 워커가 보여줄 리마인더 문구를 가져간다.
 * 웹푸시는 페이로드 없이 '깨워라'만 보내므로(webpush.ts) 문구는 여기서 사용자별로 고른다.
 * 앱(FCM)은 서버가 발송 때 같은 함수로 문구를 싣는다. 인증 필수(쿠키 — 같은 출처 요청).
 */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", messages.error.UNAUTHORIZED, 401);
    return ok(await getReminderMessage(userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
