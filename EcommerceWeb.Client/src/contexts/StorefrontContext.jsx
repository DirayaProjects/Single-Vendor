import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchStorefront } from "../services/storefrontApi";

const StorefrontContext = createContext(null);

export function StorefrontProvider({ slug, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!slug) {
        setError("Store slug is required.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const bootstrap = await fetchStorefront(slug);
        if (mounted) {
          setData(bootstrap);
        }
      } catch (err) {
        if (mounted) {
          setData(null);
          setError(err.message || "Store not found.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const value = useMemo(
    () => ({
      slug,
      settings: data?.settings || null,
      categories: data?.categories || [],
      products: data?.products || [],
      testimonials: data?.testimonials || [],
      promoAds: data?.promoAds || [],
      features: data?.features || {},
      loading,
      error,
    }),
    [slug, data, loading, error]
  );

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  const context = useContext(StorefrontContext);
  if (!context) {
    throw new Error("useStorefront must be used within StorefrontProvider");
  }
  return context;
}
