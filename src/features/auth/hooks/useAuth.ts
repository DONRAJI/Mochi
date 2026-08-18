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
