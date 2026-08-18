"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth.api";
import { setIdleSession, clearIdleSession } from "../idleSession";
import type {
  SignupRequest,
  LoginRequest,
  AuthUserResponse,
  DisplayMode,
  PreferencesRequest,
} from "../types";

export const meKey = ["auth", "me"] as const;
export const preferencesKey = ["auth", "preferences"] as const;

/** 현재 로그인 유저. 미인증(401)이면 error 상태(재시도 안 함). */
export function useMe() {
  return useQuery<AuthUserResponse>({ queryKey: meKey, queryFn: authApi.fetchMe, retry: false });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SignupRequest) => authApi.signup(input),
    onSuccess: (user) => {
      qc.setQueryData(meKey, user);
      clearIdleSession(); // 가입은 로그인 유지 — 유휴 로그아웃 대상 아님
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: (user, variables) => {
      qc.setQueryData(meKey, user);
      setIdleSession(variables.remember); // 유지 안 하면 유휴 자동 로그아웃 활성
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(meKey, null);
      clearIdleSession();
    },
  });
}

/** 계정 탈퇴 (되돌릴 수 없음, Play 정책). 성공 시 모든 캐시 비우고 로그인 화면으로. */
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => {
      clearIdleSession();
      qc.clear(); // 남은 개인 데이터 캐시 전부 제거
    },
  });
}

/** 숫자 표시 모드 변경 (#4) — 성공 시 me 갱신 + 식단·기록 무효화(숫자 노출 반영). */
export function useSetDisplayMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: DisplayMode) => authApi.setDisplayMode(mode),
    onSuccess: (user) => {
      qc.setQueryData(meKey, user);
      qc.invalidateQueries({ queryKey: ["recommend"] });
      qc.invalidateQueries({ queryKey: ["record"] });
    },
  });
}

/** 닉네임 변경 (설정) — 성공 시 me 갱신(마이 인사말이 바로 바뀐다). */
export function useSetNickname() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nickname: string) => authApi.setNickname(nickname),
    onSuccess: (user) => qc.setQueryData(meKey, user),
  });
}

/** 비밀번호 찾기 메일 요청 (비로그인). 계정 유무와 무관하게 성공한다. */
export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) });
}

/** 메일 링크로 새 비밀번호 설정 (비로그인). 성공 시 서버가 모든 세션을 폐기한다. */
export function useResetPassword() {
  return useMutation({
    mutationFn: (v: { token: string; password: string }) =>
      authApi.resetPassword(v.token, v.password),
  });
}

/** 로그인 상태에서 비밀번호 변경 (설정). 서버가 다른 기기 세션을 끊고 이 브라우저만 이어준다. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (v: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(v.currentPassword, v.newPassword),
  });
}

/** 메일 링크의 토큰으로 이메일 인증 (비로그인 가능 — 다른 기기에서 열 수 있으므로). */
export function useVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    // 로그인 상태로 열었다면 설정 화면의 인증 배지가 바로 반영되게.
    onSuccess: () => qc.invalidateQueries({ queryKey: meKey }),
  });
}

/** 인증 메일 다시 보내기 (설정). */
export function useResendVerification() {
  return useMutation({ mutationFn: () => authApi.resendVerification() });
}

/** 내 취향(선호·비선호·알러지). 추천에 반영됨. */
export function usePreferences() {
  return useQuery({ queryKey: preferencesKey, queryFn: authApi.fetchPreferences, retry: false });
}

export function useSavePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PreferencesRequest) => authApi.savePreferences(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: preferencesKey });
      qc.invalidateQueries({ queryKey: ["recommend"] }); // 추천이 취향을 반영하므로 갱신
    },
  });
}
