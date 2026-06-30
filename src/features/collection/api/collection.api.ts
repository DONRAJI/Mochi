import { fetcher } from "@/lib/fetcher";
import type { CollectionTab, CollectibleResponse } from "../types";

export function fetchCollection(type: CollectionTab): Promise<CollectibleResponse[]> {
  return fetcher<CollectibleResponse[]>(`/api/collection?type=${type}`);
}
