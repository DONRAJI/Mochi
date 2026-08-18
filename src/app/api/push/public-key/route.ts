import { vapidPublicKey } from "@/server/push/webpush";
import { ok, toErrorResponse } from "@/lib/api-response";

/** GET /api/push/public-key — 구독용 VAPID 공개키(공개 정보). 미구성이면 null(UI가 섹션 숨김). */
export async function GET() {
  try {
    return ok({ key: vapidPublicKey() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
