import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useStoreSlug } from "../hooks/useStoreSlug";
import { fetchStoreSettingsBySlug } from "../services/storefrontApi";

const Ctx = createContext(null);

/** Defaults when API omits `features` or before load (permissive). */
export const defaultStorefrontFeatures = {
  productRatingStars: true,
  customerProductReviews: true,
  storefrontTestimonials: true,
  promoAdsSection: true,
  adminSalesAnalytics: true,
  adminOrders: true,
  storefrontCartCheckout: true,
  wishlistFavorites: true,
  adminAttributes: true,
};

function mergeFeatures(raw) {
  if (!raw || typeof raw !== "object") return { ...defaultStorefrontFeatures };
  return { ...defaultStorefrontFeatures, ...raw };
}

export function StorefrontSettingsProvider({ children }) {
  const { apiSlug } = useStoreSlug();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!apiSlug) {
      setSettings(null);
      setLoading(false);
      setError("");
      return undefined;
    }
    setLoading(true);
    setError("");
    (async () => {
      try {
        const data = await fetchStoreSettingsBySlug(apiSlug);
        if (!cancelled) {
          setSettings(data);
        }
      } catch (e) {
        if (!cancelled) {
          setSettings(null);
          setError(e.message || "Could not load store.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiSlug]);

  const features = useMemo(() => mergeFeatures(settings?.features), [settings]);

  const value = useMemo(
    () => ({
      apiSlug,
      settings,
      features,
      loading,
      error,
      reload: async () => {
        if (!apiSlug) {
          setSettings(null);
          return null;
        }
        try {
          const data = await fetchStoreSettingsBySlug(apiSlug);
          setSettings(data);
          return data;
        } catch (e) {
          setSettings(null);
          throw e;
        }
      },
    }),
    [apiSlug, settings, features, loading, error]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStorefrontSettings() {
  const v = useContext(Ctx);
  if (!v) {
    return {
      apiSlug: null,
      settings: null,
      features: defaultStorefrontFeatures,
      loading: false,
      error: "",
      reload: async () => null,
    };
  }
  return v;
}
