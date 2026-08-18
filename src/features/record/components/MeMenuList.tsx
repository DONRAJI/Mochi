"use client";

import { useRouter } from "next/navigation";
import { ME_MENU } from "../data";

/** 마이 메뉴 — 실제 화면으로 이동하는 항목만 (data.ts 주석 참고). */
export function MeMenuList() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      {ME_MENU.map((i) => (
        <button
          key={i.label}
          type="button"
          onClick={() => router.push(i.href)}
          className="flex items-center justify-between rounded-mochi bg-cream-50 px-4 py-3 shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
        >
          <span className="flex items-center gap-3">
            <span className="text-xl">{i.emoji}</span>
            <span className="text-cocoa">{i.label}</span>
          </span>
          <span className="text-sm text-cocoa-faint">{i.hint} ›</span>
        </button>
      ))}
    </div>
  );
}
