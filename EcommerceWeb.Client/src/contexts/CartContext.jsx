import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_CHANGED_EVENT, getAuthSession } from "../services/authApi";
import { addToCart as addToCartApi, getCart, removeCartItem, updateCartItem } from "../services/cartApi";
import { clearPendingCartAdd, getPendingCartAdd, savePendingCartAdd } from "../utils/pendingCartStorage";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [loading, setLoading] = useState(false);

  const getCustomerSession = () => {
    const session = getAuthSession();
    if (!session?.userId || session.isAdmin) {
      return null;
    }
    return session;
  };

  const refreshCart = useCallback(async () => {
    const session = getCustomerSession();
    if (!session) {
      setCart({ items: [], subtotal: 0, itemCount: 0 });
      return;
    }

    try {
      setLoading(true);
      const pending = getPendingCartAdd();
      if (pending?.productId) {
        clearPendingCartAdd();
        try {
          const data = await addToCartApi(
            session.userId,
            pending.productId,
            pending.quantity ?? 1,
            pending.selectedAttributes ?? {}
          );
          setCart(data);
          return;
        } catch {
          savePendingCartAdd(pending);
        }
      }

      const data = await getCart(session.userId);
      setCart(data);
    } catch {
      setCart({ items: [], subtotal: 0, itemCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    const onAuthChanged = () => {
      refreshCart();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refreshCart]);

  const addItem = async (productId, quantity = 1, selectedAttributes = {}) => {
    const session = getCustomerSession();
    if (!session) {
      return { needsLogin: true };
    }

    const data = await addToCartApi(session.userId, productId, quantity, selectedAttributes);
    setCart(data);
    return { needsLogin: false };
  };

  const updateItem = async (cartItemId, quantity) => {
    const session = getCustomerSession();
    if (!session) return;
    const data = await updateCartItem(cartItemId, session.userId, quantity);
    setCart(data);
  };

  const removeItem = async (cartItemId) => {
    const session = getCustomerSession();
    if (!session) return;
    const data = await removeCartItem(cartItemId, session.userId);
    setCart(data);
  };

  const value = useMemo(
    () => ({
      items: cart.items || [],
      subtotal: cart.subtotal || 0,
      itemCount: cart.itemCount || 0,
      loading,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      isLoggedInCustomer: Boolean(getCustomerSession()),
    }),
    [cart, loading, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export function useCustomerAuth() {
  const session = getAuthSession();
  const isCustomer = Boolean(session?.userId && !session.isAdmin);
  return { session, isCustomer };
}
