import { fetcher } from "@/lib/fetcher";
import type {
  SignupRequest,
  LoginRequest,
  AuthUserResponse,
  DisplayMode,
  PreferencesRequest,
  PreferencesResponse,
} from "../types";

/** 클라 호출 함수 (conventions.md: 컴포넌트에서 직접 fetch 금지 → 이 함수 → TanStack Query 순). */
export function signup(input: SignupRequest): Promise<AuthUserResponse> {
  return fetcher<AuthUserResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginRequest): Promise<AuthUserResponse> {
  return fetcher<AuthUserResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** 계정 탈퇴 (되돌릴 수 없음) — 기록·사진·도감 전부 삭제. */
export function deleteAccount(): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/auth/account", { method: "DELETE" });
}

export function fetchMe(): Promise<AuthUserResponse> {
  return fetcher<AuthUserResponse>("/api/auth/me");
}

export function setDisplayMode(displayMode: DisplayMode): Promise<AuthUserResponse> {
  return fetcher<AuthUserResponse>("/api/auth/display-mode", {
    method: "PUT",
    body: JSON.stringify({ displayMode }),
  });
}

export function setNickname(nickname: string): Promise<AuthUserResponse> {
  return fetcher<AuthUserResponse>("/api/auth/nickname", {
    method: "PUT",
    body: JSON.stringify({ nickname }),
  });
}

export function fetchPreferences(): Promise<PreferencesResponse> {
  return fetcher<PreferencesResponse>("/api/auth/preferences");
}

export function savePreferences(input: PreferencesRequest): Promise<PreferencesResponse> {
  return fetcher<PreferencesResponse>("/api/auth/preferences", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
