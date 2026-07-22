"use client";

import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/**
 * 레시피 검색 입력 (cook) — 기본은 요리 이름 부분일치, '상세검색'을 켜면 재료로 검색.
 * 상태·디바운스·조회는 상위(MealsScreen)가 소유. 이 컴포넌트는 입력만.
 */
export function RecipeSearchBar({
  name,
  onName,
  advancedOpen,
  onToggleAdvanced,
  ingredients,
  onIngredients,
}: {
  name: string;
  onName: (v: string) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  ingredients: string;
  onIngredients: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="요리 이름 검색 (예: 알리오)"
            value={name}
            onChange={(e) => onName(e.target.value)}
            className="w-full"
          />
          {name && (
            <button
              type="button"
              onClick={() => onName("")}
              aria-label="검색어 지우기"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleAdvanced}
          aria-pressed={advancedOpen}
          className={cn(
            "whitespace-nowrap rounded-mochi-sm px-3 py-2 text-sm transition-transform ease-jelly active:scale-95",
            advancedOpen ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint",
          )}
        >
          🔍 상세검색
        </button>
      </div>
      {advancedOpen && (
        <Input
          placeholder="재료로 검색 (예: 두부, 계란) — 쉼표로 구분"
          value={ingredients}
          onChange={(e) => onIngredients(e.target.value)}
          className="w-full"
        />
      )}
    </div>
  );
}
