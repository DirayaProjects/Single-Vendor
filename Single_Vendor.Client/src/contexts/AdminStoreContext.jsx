import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminApi } from "../services/adminApi";
import { defaultStorefrontFeatures } from "./StorefrontSettingsContext";

const Ctx = createContext(null);

function mergeFeatures(raw) {
  if (!raw || typeof raw !== "object") return { ...defaultStorefrontFeatures };
  return { ...defaultStorefrontFeatures, ...raw };
}

export function AdminStoreProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const data = await adminApi("/api/admin/store");
        if (!cancelled) setSettings(data);
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
  }, []);

  const features = useMemo(() => mergeFeatures(settings?.features), [settings]);

  const value = useMemo(
    () => ({
      settings,
      features,
      loading,
      error,
      reload: async () => {
        const data = await adminApi("/api/admin/store");
        setSettings(data);
        return data;
      },
    }),
    [settings, features, loading, error]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStore() {
  const v = useContext(Ctx);
  if (!v) {
    return {
      settings: null,
      features: defaultStorefrontFeatures,
      loading: false,
      error: "",
      reload: async () => null,
    };
  }
  return v;
}
