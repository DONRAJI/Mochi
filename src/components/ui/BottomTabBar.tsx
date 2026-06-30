"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/fridge", label: "냉장고", icon: "🧊" },
  { href: "/meals", label: "식단", icon: "🍽️" },
  { href: "/collection", label: "도감", icon: "📖" },
  { href: "/me", label: "마이", icon: "👤" },
] as const;

/** 하단 탭 네비게이션 (IA 5탭 — PRD 3장). */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around rounded-t-mochi bg-cream-50 px-2 py-2 shadow-mochi">
      {tabs.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-mochi-sm py-1.5 text-xs",
              "transition ease-jelly active:scale-[0.94]",
              active ? "bg-mint-soft text-cocoa" : "text-cocoa-faint",
            )}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
