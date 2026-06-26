import { BottomTabBar } from "@/components/ui/BottomTabBar";

/** 인증 후 메인 셸 — 하단 탭 레이아웃 (PRD 3장 IA). */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-24 pt-6">
      {children}
      <BottomTabBar />
    </div>
  );
}
