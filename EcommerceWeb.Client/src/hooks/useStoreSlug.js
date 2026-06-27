import { useParams } from "react-router-dom";

export function useStoreSlug() {
  const { slug } = useParams();
  return {
    slug: slug?.trim() || "",
  };
}
