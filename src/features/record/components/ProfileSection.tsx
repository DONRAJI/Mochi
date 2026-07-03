"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useProfile, useSaveProfile } from "../hooks/useRecord";
import type { ActivityLevel, Gender } from "../types";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "other", label: "기타" },
];

// 표준 활동계수(Mifflin-St Jeor) 기준. desc는 사용자가 자기 활동량을 고를 수 있게 하는 짧은 안내.
const ACTIVITIES: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "low", label: "낮음", desc: "거의 앉아서" },
  { value: "medium", label: "보통", desc: "가벼운 운동" },
  { value: "high", label: "높음", desc: "주 3~5회" },
];

/**
 * opt-in 개인 프로필 (PRD 11.4) — 원하는 사람만. 저마찰 유지(강요 X).
 * 채우면 모찌가 맞춤으로 챙긴다(부드러운 가이드). 숫자 목표·칼로리 노출은 없음(불변 #2).
 */
export function ProfileSection() {
  const { data: profile } = useProfile();
  const save = useSaveProfile();

  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [heightCm, setHeightCm] = useState("");
  const [activity, setActivity] = useState<ActivityLevel | null>(null);

  useEffect(() => {
    if (!profile) return;
    setBirthYear(profile.birthYear?.toString() ?? "");
    setGender(profile.gender);
    setHeightCm(profile.heightCm?.toString() ?? "");
    setActivity(profile.activityLevel);
  }, [profile]);

  function submit() {
    save.mutate({
      birthYear: birthYear ? Number(birthYear) : null,
      gender,
      heightCm: heightCm ? Number(heightCm) : null,
      activityLevel: activity,
    });
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="font-display text-cocoa">맞춤 챙김 (선택)</p>
        <p className="text-sm text-cocoa-faint">
          {profile?.personalized
            ? "이제 모찌가 맞춤으로 챙기고 있어요 🌿"
            : "원하면 알려줄래요? 모찌가 더 잘 맞춰 응원해요. 비워둬도 괜찮아요."}
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="태어난 해 (예: 1998)"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder="키 (cm)"
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-1 text-sm text-cocoa-faint">성별</p>
        <div className="flex gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGender(g.value)}
              className={cn(
                "flex-1 rounded-mochi-sm px-3 py-2 text-sm transition-transform ease-jelly active:scale-95",
                gender === g.value ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm text-cocoa-faint">활동량</p>
        <div className="flex gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setActivity(a.value)}
              className={cn(
                "flex-1 rounded-mochi-sm px-2 py-2 leading-tight transition-transform ease-jelly active:scale-95",
                activity === a.value ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint",
              )}
            >
              <span className="block text-sm">{a.label}</span>
              <span className="mt-0.5 block text-[11px] text-cocoa-faint">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={submit}>
        {save.isPending ? "저장하는 중…" : "저장"}
      </Button>
      {save.isError && (
        <p className="text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
      )}
    </Card>
  );
}
