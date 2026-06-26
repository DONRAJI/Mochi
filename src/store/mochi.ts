import { create } from "zustand";
import type { MochiState } from "@/types/mochi";

/** 전역 클라 상태: 모찌 UI 상태 (conventions.md — 상태 관리). 서버 데이터는 TanStack Query가 따로 관리. */
interface MochiStore {
  state: MochiState;
  setState: (state: MochiState) => void;
}

export const useMochiStore = create<MochiStore>((set) => ({
  state: "idle",
  setState: (state) => set({ state }),
}));
