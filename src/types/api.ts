/** 공통 응답 봉투 (conventions.md — API 설계). 모든 Route Handler는 이 형태로만 응답한다. */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface ApiError {
  code: string;
  message: string;
}
