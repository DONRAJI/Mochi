"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FetchError } from "@/lib/fetcher";
import { logout as apiLogout } from "@/features/auth/api/auth.api";
import { clearIdleSession } from "@/features/auth/idleSession";
import { isPublicPath } from "@/features/auth/publicPaths";

/** TanStack Query 전역 프로바이더 — 401 일괄 처리·재시도 정책 (conventions.md). */
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  // 아래 캐시 핸들러는 QueryClient 생성 시 한 번만 묶이므로, 최신 router는 ref로 참조한다.
  const routerRef = useRef(router);
  routerRef.current = router;
  // 여러 쿼리가 동시에 401이 나도 복구는 한 번만(로그아웃 요청·화면 이동 중복 방지).
  const recovering = useRef(false);

  const [client] = useState(() => {
    /**
     * 세션이 끝났는데 쿠키만 남은 '좀비 상태' 복구.
     *
     * 미들웨어는 쿠키 **존재**만 보고(`src/middleware.ts`) `/api/*`는 matcher에도 없어서,
     * 서버 세션이 만료·폐기되면 화면은 열리지만 모든 조회가 401이 된다. 그러면 사용자는
     * 텅 빈 앱에 갇히고 빠져나올 길이 마이 탭 로그아웃뿐이었다. 이제 401을 만나면
     * 남은 쿠키를 정리하고 로그인 화면으로 부드럽게 돌려보낸다.
     */
    async function recoverFromExpiredSession(error: unknown) {
      if (!(error instanceof FetchError) || error.status !== 401) return;
      if (typeof window === "undefined" || isPublicPath(window.location.pathname)) return;
      if (recovering.current) return;
      recovering.current = true;

      clearIdleSession();
      await apiLogout().catch(() => {}); // 서버 세션은 이미 끝났고, 남아 있는 쿠키만 정리
      qc.clear();
      routerRef.current.replace("/login");
    }

    const qc = new QueryClient({
      queryCache: new QueryCache({
        onError: recoverFromExpiredSession,
        // 서버와 다시 통하면 복구 가드를 풀어, 다음에 세션이 끝났을 때도 똑같이 안내한다.
        onSuccess: () => {
          recovering.current = false;
        },
      }),
      mutationCache: new MutationCache({ onError: recoverFromExpiredSession }),
      defaultOptions: {
        queries: {
          // 탭 재방문 시 즉시 캐시 표시(변경은 mutation이 무효화로 갱신하므로 길게 잡아도 안전).
          staleTime: 60_000, // 1분간 fresh — 재방문 refetch·깜빡임 없음
          gcTime: 10 * 60_000, // 10분간 캐시 유지 — 탭 왕복해도 데이터 살아있음
          // 4xx는 다시 물어봐도 답이 같다(401·403·404·검증) → 재시도 낭비 없이 바로 처리.
          retry: (failureCount, error) => {
            if (error instanceof FetchError && error.status >= 400 && error.status < 500) {
              return false;
            }
            return failureCount < 1;
          },
          refetchOnWindowFocus: false, // 모바일 포커스 복귀마다 refetch 안 함
          // 네트워크가 돌아오면 stale된 것만 다시 불러온다 — 지하철·엘리베이터에서 끊긴 화면이
          // 계속 비어 있지 않게. (online 이벤트에만 반응하므로 평소 요청량은 그대로.)
          refetchOnReconnect: true,
        },
      },
    });
    return qc;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
