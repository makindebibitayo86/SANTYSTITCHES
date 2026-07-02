import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "santy_cart";

// A cart line is unique per product + size (same product, different size = separate line).
function lineKey(id, size) {
  return `${id}::${size || ""}`;
}

function loadCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable — cart just won't persist across reloads.
    }
  }, [items]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  // product: { id, name, price, image }, size optional, quantity defaults to 1.
  // details: optional fit preferences from the product modal (sleeve, height, age, note) —
  // attached to the line so they can be shown in the cart and later included in the
  // order record / Stripe metadata at checkout.
  const addToCart = useCallback((product, size = "", quantity = 1, details = null) => {
    setItems((prev) => {
      const key = lineKey(product.id, size);
      const existing = prev.find((it) => lineKey(it.id, it.size) === key);
      if (existing) {
        return prev.map((it) =>
          lineKey(it.id, it.size) === key
            ? { ...it, quantity: it.quantity + quantity, details: details || it.details }
            : it
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          size,
          quantity,
          details,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((id, size = "") => {
    setItems((prev) => prev.filter((it) => lineKey(it.id, it.size) !== lineKey(id, size)));
  }, []);

  const updateQuantity = useCallback((id, size = "", quantity) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((it) => lineKey(it.id, it.size) !== lineKey(id, size));
      }
      return prev.map((it) =>
        lineKey(it.id, it.size) === lineKey(id, size) ? { ...it, quantity } : it
      );
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartCount = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items]);
  const cartTotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.price) || 0) * it.quantity, 0),
    [items]
  );

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
