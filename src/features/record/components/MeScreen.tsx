"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProfileSection } from "./ProfileSection";
import { TodayMealsStrip } from "./TodayMealsStrip";
import { MeMenuList } from "./MeMenuList";
import { PreferencesSection } from "@/features/auth/components/PreferencesSection";
import { DisplayModeToggle } from "@/features/auth/components/DisplayModeToggle";
import { useMe, useLogout, useDeleteAccount } from "@/features/auth/hooks/useAuth";
import { useStreak } from "../hooks/useRecord";
import { useMochiState } from "@/features/mochi/hooks/useMochi";

/**
 * 👤 마이 — 기록·더보기. 숫자(체중·통계)는 '더보기' 안에서만 펼쳐 본다 (불변 #2).
 */
export function MeScreen() {
  const [showStats, setShowStats] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const { data: me, isPending: mePending } = useMe();
  const { data: streak, isPending: streakPending } = useStreak();
  const { data: mochi, isPending: mochiPending } = useMochiState();
  const profilePending = mePending || streakPending || mochiPending;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">마이</h1>

      <Card className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-mochi-lg bg-mint-soft text-2xl">
          •‿•
        </span>
        {/* 닉네임·스트릭·카드 수는 값이 오기 전 "모찌 친구 / 0일째 / 0개"로 그리면 튄다(불변 #1). */}
        {profilePending ? (
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <div>
            <p className="font-display text-cocoa">{me?.nickname ?? "모찌 친구"}</p>
            <p className="text-sm text-cocoa-faint">
              스트릭 {streak?.count ?? 0}일째 · 모은 카드 {mochi?.collectedCount ?? 0}개
            </p>
          </div>
        )}
      </Card>

      <DisplayModeToggle />

      <TodayMealsStrip />

      {/* 체중 기록 — 설정과 분리한 first-class 진입 (전용 화면 /me/weight, 불변 #2 유지) */}
      <button
        type="button"
        onClick={() => router.push("/me/weight")}
        className="flex items-center justify-between rounded-mochi bg-lavender-soft px-4 py-3 shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 text-cocoa">
          <span className="text-lg">⚖️</span> 체중 기록
        </span>
        <span className="text-sm text-cocoa-faint">주간·월별·연간 흐름 ›</span>
      </button>

      {/* 기록 되돌아보기 — 날짜별 식사+체중 회고 (전용 화면 /me/history) */}
      <button
        type="button"
        onClick={() => router.push("/me/history")}
        className="flex items-center justify-between rounded-mochi bg-mint-soft px-4 py-3 shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 text-cocoa">
          <span className="text-lg">⏳</span> 기록 되돌아보기
        </span>
        <span className="text-sm text-cocoa-faint">먹은 것 · 체중 흐름 ›</span>
      </button>

      <PreferencesSection />

      <button
        type="button"
        onClick={() => setShowStats((s) => !s)}
        className="flex items-center justify-between rounded-mochi bg-cream-50 px-4 py-3 shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
      >
        <span className="text-cocoa">맞춤 설정 더보기</span>
        <span className="text-sm text-cocoa-faint">{showStats ? "접기" : "펼치기"}</span>
      </button>
      {showStats && <ProfileSection />}

      <MeMenuList />

      <button
        type="button"
        onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/login") })}
        className="mt-2 rounded-mochi bg-cream-50 px-4 py-3 text-center text-sm text-cocoa-faint shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
      >
        {logout.isPending ? "나가는 중…" : "로그아웃"}
      </button>

      {/* 하단: 개인정보처리방침 + 계정 탈퇴 (Google Play 정책 — 삭제 수단 제공) */}
      <div className="mt-2 flex flex-col items-center gap-2 pb-2">
        <Link href="/privacy" className="text-xs text-cocoa-faint underline">
          개인정보처리방침
        </Link>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="text-xs text-cocoa-faint transition-transform ease-jelly active:scale-95"
        >
          계정 탈퇴
        </button>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🥺</span>
          <p className="font-display text-lg text-cocoa">정말 떠나실 건가요?</p>
          <p className="text-sm text-cocoa-soft">
            탈퇴하면 모은 모찌·기록·사진이 모두 사라지고, 되돌릴 수 없어요.
          </p>
          <div className="mt-1 flex w-full gap-2">
            <Button variant="soft" className="flex-1" onClick={() => setDeleteOpen(false)}>
              더 있을래요
            </Button>
            <Button
              className="flex-1"
              onClick={() =>
                deleteAccount.mutate(undefined, { onSuccess: () => router.push("/signup") })
              }
            >
              {deleteAccount.isPending ? "정리하는 중…" : "탈퇴하기"}
            </Button>
          </div>
          {deleteAccount.isError && (
            <p className="text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
