"use client";

interface RecipePagerProps {
  /** 0부터 시작하는 현재 페이지 */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/**
 * 추천 목록 페이지 넘기기. 모양은 기록 되돌아보기(MealHistoryScreen)의 페이지 넘기기와
 * 같게 맞췄다 — 앱 안에서 '페이지를 넘긴다'는 동작이 한 가지 모습으로 보이게.
 * 한 페이지뿐이면 그리지 않는다.
 */
export function RecipePager({ page, totalPages, onChange }: RecipePagerProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 0}
        className="rounded-mochi-sm bg-cream-200 px-4 py-2 text-sm text-cocoa transition-transform ease-jelly active:scale-95 disabled:opacity-40"
      >
        ‹ 이전
      </button>
      <span className="text-sm text-cocoa-faint">
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="rounded-mochi-sm bg-cream-200 px-4 py-2 text-sm text-cocoa transition-transform ease-jelly active:scale-95 disabled:opacity-40"
      >
        다음 ›
      </button>
    </div>
  );
}
