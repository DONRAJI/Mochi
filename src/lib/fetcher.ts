import type { ApiResponse } from "@/types/api";

/**
 * 공통 fetch 래퍼 (conventions.md — API 호출 규칙).
 * - 컴포넌트에서 직접 fetch 금지. features/<도메인>/api 함수가 이걸 쓰고, 그 위를 TanStack Query가 감싼다.
 * - 401은 Query 전역 핸들러에서 로그인 이동 처리(여기서는 에러 정규화만).
 */
export class FetchError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export async function fetcher<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new FetchError("INTERNAL", "응답을 읽지 못했어요.", res.status);
  }

  if (!body.success) {
    throw new FetchError(body.error.code, body.error.message, res.status);
  }
  return body.data;
}
