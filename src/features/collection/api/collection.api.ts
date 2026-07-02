import { fetcher } from "@/lib/fetcher";
import type { CollectionTab, CollectionResponse } from "../types";

export function fetchCollection(type: CollectionTab): Promise<CollectionResponse> {
  return fetcher<CollectionResponse>(`/api/collection?type=${type}`);
}
