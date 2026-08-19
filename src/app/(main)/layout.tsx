import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { PrefetchTabs } from "./PrefetchTabs";
import { IdleGuard } from "./IdleGuard";
import { NativeShellBridge } from "@/features/notify/components/NativeShellBridge";

/** 인증 후 메인 셸 — 하단 탭 레이아웃 (PRD 3장 IA). */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-24 pt-6">
      {children}
      <BottomTabBar />
      <PrefetchTabs />
      <IdleGuard />
      {/* Capacitor 셸 전용 동작(뒤로가기·외부링크·알림 탭) — 브라우저에선 아무 일도 안 한다. */}
      <NativeShellBridge />
    </div>
  );
}
