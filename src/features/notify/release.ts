import { isNativeApp, releaseNativePushToken } from "./native";

/**
 * 로그아웃 시 **이 기기에 남는** 리마인더 상태를 정리한다.
 *
 * 서버 쪽 행(웹 구독·네이티브 토큰)은 `logout()`이 계정 기준으로 지운다. 여기서 하는 일은
 * 기기 로컬 상태를 그 결과와 맞추는 것이다:
 * - 앱: FCM 등록 해지 + 로컬 토큰 삭제 (releaseNativePushToken)
 * - 브라우저: `PushManager` 구독 해지 — **안 하면 브라우저는 여전히 '구독 중'이라고 믿는다.**
 *   그러면 설정 화면이 '켜짐'으로 보이는데 서버엔 행이 없어(알림은 안 옴) 상태가 어긋나고,
 *   사용자가 껐다 켜도 같은 endpoint라 되살릴 수 없다.
 *
 * 실패해도 로그아웃을 막지 않는다 — 알림 정리는 로그아웃의 부수 작업이지 전제가 아니다.
 */
export async function releaseReminderChannel(): Promise<void> {
  if (isNativeApp()) {
    await releaseNativePushToken();
    return;
  }
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch {
    // SW 미등록(dev)·권한 변경 등 — 서버 쪽은 이미 정리되므로 조용히 넘어간다
  }
}
