"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth.api";
import type { SignupRequest, LoginRequest, AuthUserResponse } from "../types";

export const meKey = ["auth", "me"] as const;

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
