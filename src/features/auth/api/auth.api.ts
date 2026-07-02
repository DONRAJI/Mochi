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

export function fetchMe(): Promise<AuthUserResponse> {
  return fetcher<AuthUserResponse>("/api/auth/me");
}

export function setDisplayMode(displayMode: DisplayMode): Promise<AuthUserResponse> {
  return fetcher<AuthUserResponse>("/api/auth/display-mode", {
    method: "PUT",
    body: JSON.stringify({ displayMode }),
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
