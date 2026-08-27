"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp, nativePlugins, listenNative, removeHandle, type ListenerHandle } from "../native";

/**
 * Capacitor 셸 안에서만 동작하는 네이티브 연결선 (브라우저에선 아무것도 하지 않는다).
 *
 * 셸은 원격 URL 모드라 **로드되는 것이 이 웹앱**이다. 그래서 뒤로가기·외부링크·알림 탭
 * 같은 '앱다운 동작'을 Java가 아니라 여기서 배선한다. TWA에선 공짜로 얻던 것들이라
 * 전환 시 직접 구현이 필요한 항목(workflow.md §7).
 */
export function NativeShellBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;
    const { app, browser, push, splash } = nativePlugins();
    // 정리 시점에 아직 등록이 안 끝났을 수 있어, 배열을 공유해 나중에 들어온 것도 해제한다.
    const handles: ListenerHandle[] = [];
    let disposed = false;

    // 첫 화면이 그려졌으니 스플래시를 내린다(웹 로딩 동안만 보이게).
    void Promise.resolve(splash?.hide()).catch(() => {});

    // 앱이 이 계정의 리마인더 채널을 가져간다 — 예전에 이 폰의 브라우저(삼성인터넷·크롬)에서
    // 리마인더를 켠 적이 있으면 그 구독이 서버에 그대로 남아, 앱을 쓰는 지금도 브라우저 명의로
    // 알림이 뜬다. 앱은 그 구독의 endpoint를 알 수 없으므로(다른 실행 컨텍스트) 계정 기준으로
    // 지워달라고 부탁한다. 리마인더를 켜지 않은 사용자에게도 필요해서 부팅 시 1회 보낸다.
    // 미로그인이면 401 — 그냥 넘긴다(다음 실행에서 다시 시도).
    void import("../api/notify.api")
      .then(({ unsubscribeAllPush }) => unsubscribeAllPush())
      .catch(() => {});

    // 안드로이드 뒤로가기: 갈 곳이 있으면 뒤로, 앱 첫 화면이면 종료.
    // 리스너를 달면 기본 동작을 우리가 가져오므로 두 갈래를 직접 처리해야 한다.
    void listenNative(app, "backButton", ({ canGoBack }) => {
      if (canGoBack) router.back();
      else void Promise.resolve(app?.exitApp()).catch(() => {});
    }).then((h) => {
      if (!h) return;
      if (disposed) removeHandle(h);
      else handles.push(h);
    });

    // 알림 탭 → 서버가 data.url에 실어 보낸 경로로(기본 /meals). 앱이 이미 떠 있든 아니든 동일.
    void listenNative(push, "pushNotificationActionPerformed", (e) => {
      const url = e.notification?.data?.url;
      if (url && url.startsWith("/")) router.push(url);
    }).then((h) => {
      if (!h) return;
      if (disposed) removeHandle(h);
      else handles.push(h);
    });

    // 외부 링크(레시피 원문 등)는 시스템 브라우저로 — WebView 안에서 열리면 돌아올 길이 없다.
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!href || !/^https?:\/\//i.test(href)) return;
      if (new URL(href, window.location.href).origin === window.location.origin) return;
      e.preventDefault();
      void Promise.resolve(browser?.open({ url: href })).catch(() => {});
    }
    document.addEventListener("click", onClick);

    return () => {
      disposed = true;
      document.removeEventListener("click", onClick);
      handles.forEach(removeHandle);
    };
  }, [router]);

  return null;
}
