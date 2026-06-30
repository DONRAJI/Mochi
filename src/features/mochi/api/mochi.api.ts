import { fetcher } from "@/lib/fetcher";
import type { MochiStateResponse } from "../types";

export function fetchMochiState(): Promise<MochiStateResponse> {
  return fetcher<MochiStateResponse>("/api/mochi/state");
}
