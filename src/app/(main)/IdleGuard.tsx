"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { logout as apiLogout } from "@/features/auth/api/auth.api";
import { isIdleExpired, touchActive, clearIdleSession } from "@/features/auth/idleSession";

/**
 * 유휴 세션 자동 로그아웃 가드 — '로그인 유지' 안 한 사용자가 앱을 오래 떠나 있다 돌아오면 재로그인.
 * 앱 재진입(포그라운드 복귀)·첫 로드 시 떠나 있던 시간을 확인하고, 백그라운드로 갈 때 시각을 남긴다.
 */
export function IdleGuard() {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    async function onReturn() {
      if (isIdleExpired()) {
        clearIdleSession();
        await apiLogout().catch(() => {}); // 서버 세션·쿠키 폐기
        qc.clear();
        router.replace("/login");
      } else {
        touchActive(); // 아직 유효 — 활동 시각 갱신
      }
    }
    // 첫 진입(킬 후 새로 뜬 경우 포함): 떠나 있던 시간 확인
    onReturn();
    function onVisibility() {
      if (document.visibilityState === "visible") onReturn();
      else touchActive(); // 백그라운드로 갈 때 마지막 활동 기록(킬 대비)
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router, qc]);

  return null;
}
