"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { WeightTrendChart } from "./WeightTrendChart";
import { useWeightLogs, useAddWeight } from "../hooks/useRecord";

/** 체중 기록 입력 + 흐름 그래프 (마이>더보기). 숫자는 여기에만 (불변 #2). */
export function WeightSection() {
  const { data } = useWeightLogs();
  const add = useAddWeight();
  const [value, setValue] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const w = Number(value);
    if (!w || w < 20 || w > 300) return;
    add.mutate(w, { onSuccess: () => setValue("") });
  }

  const points = data ?? [];

  return (
    <Card className="flex flex-col gap-3">
      <form onSubmit={submit} className="flex gap-2">
        <Input
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

      {points.length >= 2 ? (
        <WeightTrendChart points={points} />
      ) : (
        <p className="py-3 text-center text-sm text-cocoa-soft">
          기록이 쌓이면 부드러운 흐름이 보여요 🌿
        </p>
      )}
    </Card>
  );
}
