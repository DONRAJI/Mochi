"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** TanStack Query 전역 프로바이더. 401 일괄 처리 등 전역 핸들러는 여기서 확장 (conventions.md). */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 탭 재방문 시 즉시 캐시 표시(변경은 mutation이 무효화로 갱신하므로 길게 잡아도 안전).
            staleTime: 60_000, // 1분간 fresh — 재방문 refetch·깜빡임 없음
            gcTime: 10 * 60_000, // 10분간 캐시 유지 — 탭 왕복해도 데이터 살아있음
            retry: 1,
            refetchOnWindowFocus: false, // 모바일 포커스 복귀마다 refetch 안 함
            refetchOnReconnect: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
