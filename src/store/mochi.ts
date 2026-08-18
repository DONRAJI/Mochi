import { create } from "zustand";

/**
 * 전역 클라 상태: 모찌 환호(cheer) 오버레이 (conventions.md — 상태 관리).
 *
 * 왜 '오버레이'인가: 홈 아바타의 평소 표정(happy/sleepy/idle)은 서버가 파생한다
 * (getMochiState — TanStack Query 소유). 그런데 cheer는 서버가 반환하는 경로가 없다 —
 * '먹었어요' 직후의 **순간 반응**이라 저장할 상태가 아니기 때문. 예전엔 이 스토어가
 * MochiState를 통째로 들고 있었지만 읽는 곳이 없어 cheer가 화면에 영영 안 나왔다.
 * 이제 '언제 환호했나'만 기록하고, 홈이 몇 초간 cheer를 덧그린 뒤 서버 상태로 복귀한다.
 */
interface MochiStore {
  /** 마지막 환호 시각 (epoch ms). null이면 평소 표정. */
  cheerAt: number | null;
  /** '먹었어요'·뽑기 성공 직후 호출 — 모찌가 잠깐 환호한다. */
  cheer: () => void;
  /** 환호 시간이 지나면 홈이 호출 — 서버 상태로 복귀. */
  settle: () => void;
}

export const useMochiStore = create<MochiStore>((set) => ({
  cheerAt: null,
  cheer: () => set({ cheerAt: Date.now() }),
  settle: () => set({ cheerAt: null }),
}));
