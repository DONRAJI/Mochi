"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth.api";
import { setIdleSession, clearIdleSession } from "../idleSession";
import { releaseReminderChannel } from "@/features/notify/release";
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

/**
 * 계정이 바뀌는 순간(가입·로그인·로그아웃)엔 **이전 계정의 서버 데이터 캐시를 전부 버린다.**
 *
 * 예전엔 `me` 하나만 갈아 끼웠다. 그래서 로그아웃 → 새 계정 가입을 하면 서버 세션은 새
 * 계정인데, 스트릭·모찌·냉장고·기록 같은 나머지 쿼리는 옛 계정 값이 캐시(신선 1분·보관
 * 10분)에 남아 **새 계정 이름 옆에 옛 계정 데이터**가 떴다. 앱을 껐다 켜야(메모리 캐시
 * 소멸) 정상이 됐다.
 *
 * `clear()`가 아니라 `removeQueries()`인 이유: 이 함수는 뮤테이션 onSuccess 안에서 불리므로
 * 뮤테이션 캐시까지 비우면 호출부(`mutate(..., { onSuccess })`)의 후속 동작과 얽힐 수 있다.
 * 비워야 하는 건 쿼리(서버 데이터)뿐이다.
 */
function dropAccountCache(qc: ReturnType<typeof useQueryClient>) {
  qc.removeQueries();
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SignupRequest) => authApi.signup(input),
    onSuccess: (user) => {
      dropAccountCache(qc);
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
      dropAccountCache(qc);
      qc.setQueryData(meKey, user);
      setIdleSession(variables.remember); // 유지 안 하면 유휴 자동 로그아웃 활성
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    // 로그아웃 전에 이 기기의 리마인더 채널을 해지한다 — 안 그러면 로그아웃한 뒤에도
    // 이 기기가 그 계정의 리마인더를 계속 받는다(세션은 끊겼는데 알림만 오는 상태).
    // 앱이면 FCM 토큰, 브라우저면 웹푸시 구독. 서버 쪽 행은 logout()이 계정 기준으로 지운다.
    mutationFn: async () => {
      await releaseReminderChannel();
      return authApi.logout();
    },
    onSuccess: () => {
      dropAccountCache(qc);
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
      // 음식 검색·'밖에서 먹기'도 kcal을 싣는지 서버가 모드로 정하고 10분 캐시한다 — 안 비우면
      // 숫자 모드로 바꿔도 한동안 칼로리가 안 보이고, 편하게로 돌려도 숫자가 남았다(불변 #2).
      qc.invalidateQueries({ queryKey: ["foods"] });
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
