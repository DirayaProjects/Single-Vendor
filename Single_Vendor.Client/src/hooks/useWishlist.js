import { useCallback, useEffect, useState } from "react";
import { getUserToken } from "../services/userAuth";
import {
  fetchWishlistIds,
  addWishlistProduct,
  removeWishlistProduct,
} from "../services/storefrontApi";

/**
 * Server-backed wishlist when logged in; local optimistic updates.
 * @param {boolean} enabled - e.g. features.wishlistFavorites && apiSlug
 */
export function useWishlist(enabled) {
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || !getUserToken()) {
      setIds([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchWishlistIds();
      setIds(Array.isArray(list) ? list : []);
    } catch {
      setIds([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(
    async (productId) => {
      if (!enabled || !getUserToken()) return false;
      const id = Number(productId);
      if (!Number.isFinite(id)) return false;
      const on = ids.includes(id);
      try {
        if (on) {
          await removeWishlistProduct(id);
          setIds((prev) => prev.filter((x) => x !== id));
        } else {
          await addWishlistProduct(id);
          setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        }
        return true;
      } catch {
        await reload();
        return false;
      }
    },
    [enabled, ids, reload]
  );

  const isFavorite = useCallback((productId) => ids.includes(Number(productId)), [ids]);

  return { ids, loading, reload, toggle, isFavorite };
}
