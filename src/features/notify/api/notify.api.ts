import { fetcher } from "@/lib/fetcher";
import type { PushKeyResponse, PushSubscribeRequest } from "../types";

export function fetchPushKey(): Promise<PushKeyResponse> {
  return fetcher<PushKeyResponse>("/api/push/public-key");
}

export function subscribePush(input: PushSubscribeRequest): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function unsubscribePush(endpoint: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/push/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
}
