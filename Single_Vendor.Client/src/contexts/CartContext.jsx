import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const CartContext = createContext(null);

function storageKey(storeSlug) {
  return `sv_cart_${storeSlug}`;
}

function normalizeSelectedAttributes(selectedAttributes) {
  if (!selectedAttributes || typeof selectedAttributes !== "object") return {};
  return Object.fromEntries(
    Object.entries(selectedAttributes)
      .map(([k, v]) => [String(k).trim(), String(v).trim()])
      .filter(([k, v]) => k && v)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function buildItemKey(productId, selectedAttributes) {
  const attrs = normalizeSelectedAttributes(selectedAttributes);
  return `${Number(productId)}::${JSON.stringify(attrs)}`;
}

export function CartProvider({ children }) {
  const [searchParams] = useSearchParams();
  const storeSlug = searchParams.get("storeSlug")?.trim() || "_no_store";
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(storeSlug));
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, [storeSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(storeSlug), JSON.stringify(items));
    } catch {
      /* ignore quota */
    }
  }, [items, storeSlug]);

  const addItem = useCallback((payload) => {
    const { productId, name, price, imageUrl, quantity = 1, selectedAttributes } = payload;
    const id = Number(productId);
    if (!Number.isFinite(id)) return;
    const attrs = normalizeSelectedAttributes(selectedAttributes);
    const itemKey = buildItemKey(id, attrs);
    setItems((prev) => {
      const idx = prev.findIndex((x) => (x.itemKey || buildItemKey(x.productId, x.selectedAttributes)) === itemKey);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [
        ...prev,
        {
          productId: id,
          name: name || "Product",
          price: Number(price) || 0,
          imageUrl: imageUrl || "",
          selectedAttributes: attrs,
          itemKey,
          quantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((itemKeyOrProductId) => {
    const key = String(itemKeyOrProductId || "");
    const id = Number(itemKeyOrProductId);
    setItems((prev) =>
      prev.filter((x) => {
        const xKey = x.itemKey || buildItemKey(x.productId, x.selectedAttributes);
        if (key.includes("::")) return xKey !== key;
        if (Number.isFinite(id)) return x.productId !== id;
        return true;
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const setQuantity = useCallback((itemKeyOrProductId, quantity) => {
    const key = String(itemKeyOrProductId || "");
    const id = Number(itemKeyOrProductId);
    const q = Math.floor(Number(quantity)) || 0;
    if (q < 1) {
      setItems((prev) =>
        prev.filter((x) => {
          const xKey = x.itemKey || buildItemKey(x.productId, x.selectedAttributes);
          if (key.includes("::")) return xKey !== key;
          if (Number.isFinite(id)) return x.productId !== id;
          return true;
        })
      );
      return;
    }
    setItems((prev) =>
      prev.map((x) => {
        const xKey = x.itemKey || buildItemKey(x.productId, x.selectedAttributes);
        if (key.includes("::")) return xKey === key ? { ...x, quantity: q } : x;
        if (Number.isFinite(id)) return x.productId === id ? { ...x, quantity: q } : x;
        return x;
      })
    );
  }, []);

  const itemCount = useMemo(() => items.reduce((n, x) => n + x.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      storeSlug,
      items,
      addItem,
      removeItem,
      clearCart,
      setQuantity,
      itemCount,
    }),
    [storeSlug, items, addItem, removeItem, clearCart, setQuantity, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
