import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAuthSession } from "../services/authApi";
import { getFavorites, toggleFavorite as toggleFavoriteApi } from "../services/favoritesApi";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState({ items: [], productIds: [], count: 0 });
  const [loading, setLoading] = useState(false);

  const getCustomerSession = () => {
    const session = getAuthSession();
    if (!session?.userId || session.isAdmin) {
      return null;
    }
    return session;
  };

  const refreshFavorites = useCallback(async () => {
    const session = getCustomerSession();
    if (!session) {
      setFavorites({ items: [], productIds: [], count: 0 });
      return;
    }

    try {
      setLoading(true);
      const data = await getFavorites(session.userId);
      setFavorites(data);
    } catch {
      setFavorites({ items: [], productIds: [], count: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = async (productId) => {
    const session = getCustomerSession();
    if (!session) {
      return { needsLogin: true };
    }

    const data = await toggleFavoriteApi(session.userId, productId);
    setFavorites(data);
    return { needsLogin: false };
  };

  const isFavorite = (productId) => favorites.productIds?.includes(productId);

  const value = useMemo(
    () => ({
      items: favorites.items || [],
      productIds: favorites.productIds || [],
      count: favorites.count || 0,
      loading,
      refreshFavorites,
      toggleFavorite,
      isFavorite,
    }),
    [favorites, loading, refreshFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
