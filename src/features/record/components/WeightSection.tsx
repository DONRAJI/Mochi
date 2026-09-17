"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { WeightTrendChart } from "./WeightTrendChart";
import { messages } from "@/lib/messages";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useWeightLogs, useAddWeight } from "../hooks/useRecord";
import { isWeightStale } from "../weightFreshness";

/** 체중 기록 입력 + 흐름 그래프 (마이 > 체중 전용 화면). 숫자는 마이 트리에만 (불변 #2). */
export function WeightSection() {
  const { data } = useWeightLogs();
  const add = useAddWeight();
  const [value, setValue] = useState("");
  const { data: me } = useMe();

  function submit(e: FormEvent) {
    e.preventDefault();
    const w = Number(value);
    if (!w || w < 20 || w > 300) return;
    add.mutate(w, { onSuccess: () => setValue("") });
  }

  // 넉넉히 받아온 기록 중 최근 흐름은 30개까지만 그려 곡선이 뭉치지 않게.
  const recent = (data ?? []).slice(-30);
  // 숫자 모드에서만 — 예산이 최신 체중으로 계산되니 오래된 기록이면 한 줄 권한다.
  // (기록은 마운트 뒤 조회로 오므라 렌더 중 현재 시각을 써도 프리렌더 HTML과 어긋나지 않는다)
  const last = recent.at(-1);
  const stale =
    me?.displayMode === "detail" && !!last && isWeightStale(new Date(last.loggedAt).getTime());

  return (
    <Card className="flex flex-col gap-3">
      {stale && <p className="text-sm text-cocoa-soft">{messages.weight.staleHere}</p>}
      <form onSubmit={submit} className="flex gap-2">
        <Input
          name="weight"
          autoComplete="off"
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="오늘 체중 (kg)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">{add.isPending ? "기록…" : "기록"}</Button>
      </form>

      {recent.length >= 2 ? (
        <WeightTrendChart points={recent} />
      ) : (
        <p className="py-3 text-center text-sm text-cocoa-soft">
          기록이 쌓이면 부드러운 흐름이 보여요 🌿
        </p>
      )}
    </Card>
  );
}
