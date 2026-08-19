"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp, nativePlugins } from "../native";

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
    const handles: { remove: () => Promise<void> }[] = [];

    // 첫 화면이 그려졌으니 스플래시를 내린다(웹 로딩 동안만 보이게).
    splash?.hide().catch(() => {});

    // 안드로이드 뒤로가기: 갈 곳이 있으면 뒤로, 앱 첫 화면이면 종료.
    // 리스너를 달면 기본 동작을 우리가 가져오므로 두 갈래를 직접 처리해야 한다.
    app
      ?.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) router.back();
        else app.exitApp().catch(() => {});
      })
      .then((h) => handles.push(h))
      .catch(() => {});

    // 알림 탭 → 서버가 data.url에 실어 보낸 경로로(기본 /meals). 앱이 이미 떠 있든 아니든 동일.
    push
      ?.addListener("pushNotificationActionPerformed", (e) => {
        const url = e.notification?.data?.url;
        if (url && url.startsWith("/")) router.push(url);
      })
      .then((h) => handles.push(h))
      .catch(() => {});

    // 외부 링크(레시피 원문 등)는 시스템 브라우저로 — WebView 안에서 열리면 돌아올 길이 없다.
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!href || !/^https?:\/\//i.test(href)) return;
      if (new URL(href, window.location.href).origin === window.location.origin) return;
      e.preventDefault();
      browser?.open({ url: href }).catch(() => {});
    }
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      handles.forEach((h) => void h.remove().catch(() => {}));
    };
  }, [router]);

  return null;
}
