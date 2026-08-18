"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMe, useSetNickname } from "../hooks/useAuth";

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
      </section>
    </div>
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
