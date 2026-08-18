"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { NotificationSection } from "@/features/notify/components/NotificationSection";
import { useMe, useSetNickname, useChangePassword, useResendVerification } from "../hooks/useAuth";

/**
 * ⚙️ 설정 — 계정 정보와 표시 방식. (마이 > 설정)
 *
 * 그동안 마이 하단의 '설정'은 눌리지도 않는 "곧 만나요" 자리였고, 가입 후에는 닉네임조차
 * 바꿀 수 없었다(변경 API 자체가 없었음). 실제로 되는 것만 둔다 — 빈 메뉴는 두지 않는다.
 */
export function SettingsScreen() {
  const { data: me, isPending } = useMe();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">설정</h1>

      <section className="flex flex-col gap-2">
        <p className="px-1 text-sm text-cocoa-faint">계정</p>
        {isPending ? (
          <Card className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-11 w-full" />
          </Card>
        ) : (
          <NicknameCard currentNickname={me?.nickname ?? ""} email={me?.email ?? ""} />
        )}
        {!isPending && me && !me.emailVerified && <VerifyEmailCard />}
      </section>

      <section className="flex flex-col gap-2">
        <p className="px-1 text-sm text-cocoa-faint">비밀번호</p>
        <ChangePasswordCard />
      </section>

      {/* 저녁 리마인더 (옵트인) — 서버에 VAPID가 없거나 준비 중이면 스스로 숨는다. */}
      <NotificationSection />
    </div>
  );
}

/**
 * 미인증일 때만 뜨는 권유 — 막지 않는다(저마찰 온보딩 PRD 4.1).
 * 인증을 해두면 비밀번호를 잊었을 때 복구가 가능해지므로, 그 이유를 그대로 말해준다.
 */
function VerifyEmailCard() {
  const resend = useResendVerification();
  return (
    <Card className="flex flex-col gap-2 bg-butter-soft">
      <p className="text-sm text-cocoa">이메일을 아직 확인하지 않았어요</p>
      <p className="text-xs text-cocoa-soft">
        확인해두면 비밀번호를 잊었을 때 이 주소로 다시 찾을 수 있어요.
      </p>
      {resend.isSuccess ? (
        <p className="text-sm text-cocoa-soft">메일을 보냈어요 💌 받은편지함을 봐주세요.</p>
      ) : (
        <Button variant="soft" onClick={() => resend.mutate()}>
          {resend.isPending ? "보내는 중…" : "인증 메일 받기"}
        </Button>
      )}
      {resend.isError && (
        <p className="text-sm text-cocoa-soft">{(resend.error as Error).message}</p>
      )}
    </Card>
  );
}

/** 비밀번호 변경 — 현재 비밀번호 확인 후. 성공하면 다른 기기 로그인은 끊긴다(서버에서 처리). */
function ChangePasswordCard() {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || change.isPending) return;
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setConfirm("");
        },
      },
    );
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <Input
          type="password"
          placeholder="지금 비밀번호"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <Input
          type="password"
          placeholder="새 비밀번호 (8자 이상)"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          type="password"
          placeholder="새 비밀번호 한 번 더"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {mismatch && <p className="text-sm text-cocoa-soft">두 번째 입력이 조금 다른 것 같아요.</p>}
        <Button type="submit" className={canSubmit ? undefined : "opacity-60"}>
          {change.isPending ? "바꾸는 중…" : "비밀번호 바꾸기"}
        </Button>
        {change.isSuccess && !change.isPending && (
          <p className="text-sm text-cocoa-soft">바꿨어요 🌿 다른 기기의 로그인은 정리했어요.</p>
        )}
        {change.isError && (
          <p className="text-sm text-cocoa-soft">{(change.error as Error).message}</p>
        )}
      </form>
    </Card>
  );
}

/** 닉네임 편집 + 이메일(읽기 전용). 이메일 변경은 아직 없으니 바꿀 수 있는 척하지 않는다. */
function NicknameCard({ currentNickname, email }: { currentNickname: string; email: string }) {
  const save = useSetNickname();
  const [nickname, setNickname] = useState(currentNickname);
  const trimmed = nickname.trim();
  const changed = trimmed.length > 0 && trimmed !== currentNickname;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!changed || save.isPending) return;
    save.mutate(trimmed);
  }

  return (
    <Card className="flex flex-col gap-3">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label htmlFor="nickname" className="text-sm text-cocoa-soft">
          닉네임
        </label>
        <div className="flex gap-2">
          <Input
            id="nickname"
            value={nickname}
            maxLength={20}
            placeholder="모찌가 부를 이름"
            onChange={(e) => setNickname(e.target.value)}
          />
          <Button type="submit" className={changed ? undefined : "opacity-60"}>
            {save.isPending ? "바꾸는 중…" : "저장"}
          </Button>
        </div>
        {save.isSuccess && !save.isPending && !changed && (
          <p className="text-sm text-cocoa-soft">바꿨어요 🌿</p>
        )}
        {save.isError && (
          <p className="text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
        )}
      </form>

      <div className="flex flex-col gap-1 border-t border-cream-200 pt-3">
        <span className="text-sm text-cocoa-soft">이메일</span>
        <span className="text-sm text-cocoa-faint">{email}</span>
      </div>
    </Card>
  );
}
