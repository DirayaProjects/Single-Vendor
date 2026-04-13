import { useSearchParams } from "react-router-dom";

/**
 * @returns {{ slugFromUrl: string | null, apiSlug: string | null }} No default tenant — storefront calls need a slug.
 */
export function useStoreSlug() {
  const [params] = useSearchParams();
  const raw = params.get("storeSlug")?.trim();
  return {
    slugFromUrl: raw || null,
    apiSlug: raw || null,
  };
}
