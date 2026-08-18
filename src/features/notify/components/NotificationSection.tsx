"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchPushKey, subscribePush, unsubscribePush } from "../api/notify.api";
import { urlBase64ToUint8Array } from "../push";

/**
 * 🔔 저녁 리마인더 설정 (마이 > 설정) — 옵트인.
 * 재촉이 아니라 제안: "저녁 뭐 먹을지 같이 볼까요" 톤이고, 이미 기록한 날엔 서버가 안 보낸다.
 *
 * 상태 갈래: 서버 미구성(VAPID 없음)→섹션 자체를 숨김(빈 약속 금지) ·
 * 브라우저 미지원/SW 없음(dev 포함)→부드러운 안내 · 권한 거부→시스템 설정 안내.
 */
export function NotificationSection() {
  const { data: keyData } = useQuery({ queryKey: ["push", "key"], queryFn: fetchPushKey });
  const [phase, setPhase] = useState<
    "checking" | "unsupported" | "off" | "on" | "denied"
  >("checking");

  // 현재 구독 상태 파악 — SW가 없으면(개발 모드 등) 미지원으로.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (alive) setPhase("unsupported");
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        if (alive) setPhase("unsupported"); // dev에선 SW 미등록 — 배포판에서만 켤 수 있다
        return;
      }
      if (Notification.permission === "denied") {
        if (alive) setPhase("denied");
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      if (alive) setPhase(sub ? "on" : "off");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const enable = useMutation({
    mutationFn: async () => {
      const key = keyData?.key;
      if (!key) throw new Error("잠깐 준비가 안 됐어요. 다음에 다시 볼까요?");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPhase(permission === "denied" ? "denied" : "off");
        throw new Error("알림을 허용해 주시면 켤 수 있어요.");
      }
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) throw new Error("잠깐 준비가 안 됐어요. 다음에 다시 볼까요?");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // TS의 BufferSource 판정이 까다로워 ArrayBuffer로 복사해 전달(런타임 동작 동일).
        applicationServerKey: urlBase64ToUint8Array(key).slice().buffer,
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("잠깐 안 됐어요. 다시 해볼까요?");
      }
      await subscribePush({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
    },
    onSuccess: () => setPhase("on"),
  });

  const disable = useMutation({
    mutationFn: async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
    },
    onSuccess: () => setPhase("off"),
  });

  // 서버 미구성(VAPID 없음) — 켤 수 없는 걸 보여주지 않는다(빈 약속 금지).
  if (keyData && keyData.key === null) return null;
  if (phase === "checking") return null;

  return (
    <section className="flex flex-col gap-2">
      <p className="px-1 text-sm text-cocoa-faint">알림</p>
      <Card className="flex flex-col gap-2">
        <p className="text-sm text-cocoa">🔔 저녁 리마인더</p>
        {phase === "unsupported" && (
          <p className="text-xs text-cocoa-soft">이 환경에선 알림을 아직 지원하지 않아요.</p>
        )}
        {phase === "denied" && (
          <p className="text-xs text-cocoa-soft">
            알림이 꺼져 있어요. 휴대폰 설정에서 모찌 알림을 허용하면 켤 수 있어요.
          </p>
        )}
        {phase === "off" && (
          <>
            <p className="text-xs text-cocoa-soft">
              저녁 메뉴 고민될 때쯤, 모찌가 살짝 알려드려요. 이미 기록한 날엔 조용히 있을게요.
            </p>
            <Button variant="soft" onClick={() => enable.mutate()}>
              {enable.isPending ? "켜는 중…" : "리마인더 켜기"}
            </Button>
            {enable.isError && (
              <p className="text-sm text-cocoa-soft">{(enable.error as Error).message}</p>
            )}
          </>
        )}
        {phase === "on" && (
          <>
            <p className="text-xs text-cocoa-soft">받는 중이에요 — 저녁 6시 반쯤 살짝 알려드려요.</p>
            <Button variant="soft" onClick={() => disable.mutate()}>
              {disable.isPending ? "끄는 중…" : "리마인더 끄기"}
            </Button>
            {disable.isError && (
              <p className="text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
