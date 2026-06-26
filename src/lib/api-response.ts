import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

/**
 * ApiResponse<T> 봉투 헬퍼 (StudyGroup 포팅).
 * Route Handler는 비즈니스 로직 없이 서비스 결과를 이 헬퍼로 감싸 응답한다.
 * 에러 응답에 스택 트레이스·DB 정보 포함 금지 (security.md §5) — code/message만.
 */
export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return ok(data, 201);
}

export function fail(
  code: string,
  message: string,
  status = 400,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/** 서비스 레이어에서 던지는 도메인 에러. Route Handler가 잡아 ApiResponse로 변환. */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** AppError → ApiResponse 에러로 변환. 알 수 없는 에러는 내부 정보를 감추고 일반 메시지로. */
export function toErrorResponse(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.status);
  }
  // 원본 에러는 서버 로그로만 (security.md §5)
  console.error("[unhandled]", error);
  return fail("INTERNAL", "잠깐 문제가 생겼어요. 다시 시도해 주세요.", 500);
}
