import { ME_MENU } from "../data";

/** 마이 메뉴 — 설정·알림·모찌 꾸미기 등 (PRD 3장). */
export function MeMenuList() {
  return (
    <div className="flex flex-col gap-2">
      {ME_MENU.map((i) => (
        <div
          key={i.label}
          className="flex items-center justify-between rounded-mochi bg-cream-50 px-4 py-3 opacity-70 shadow-mochi-press"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{i.emoji}</span>
            <span className="text-cocoa">{i.label}</span>
          </div>
          <span className="text-sm text-cocoa-faint">{i.hint}</span>
        </div>
      ))}
    </div>
  );
}
