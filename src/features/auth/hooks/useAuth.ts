"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth.api";
import type {
  SignupRequest,
  LoginRequest,
  AuthUserResponse,
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
    onSuccess: (user) => qc.setQueryData(meKey, user),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: (user) => qc.setQueryData(meKey, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => qc.setQueryData(meKey, null),
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
