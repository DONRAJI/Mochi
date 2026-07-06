import { fetcher } from "@/lib/fetcher";
import type {
  CollectionTab,
  CollectionResponse,
  MochiCollectionResponse,
  DrawResultResponse,
} from "../types";

export function fetchCollection(type: CollectionTab): Promise<CollectionResponse> {
  return fetcher<CollectionResponse>(`/api/collection?type=${type}`);
}

/** 모찌 뽑기 도감 (PRD 12). */
export function fetchMochiCollection(): Promise<MochiCollectionResponse> {
  return fetcher<MochiCollectionResponse>("/api/collection/mochi");
}

export function drawMochiCard(): Promise<DrawResultResponse> {
  return fetcher<DrawResultResponse>("/api/collection/draw", { method: "POST" });
}
