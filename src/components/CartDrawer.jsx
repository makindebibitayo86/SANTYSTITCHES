import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import { useCart } from "../context/CartContext";

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "—";
  return `₦${Number(price).toLocaleString()}`;
}

function detailLine(details) {
  if (!details) return "";
  const parts = [];
  if (details.sleeve) parts.push(details.sleeve);
  if (details.height) parts.push(details.height);
  if (details.age) parts.push(`Age ${details.age}`);
  return parts.join(" · ");
}

function CartLine({ item, onUpdate, onRemove }) {
  const meta = detailLine(item.details);
  return (
    <div className="flex gap-4 border-b border-black/10 py-4 dark:border-white/10">
      <div className="h-20 w-16 shrink-0 overflow-hidden bg-black/5 dark:bg-white/5">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-['Playfair_Display'] text-sm text-black dark:text-white">{item.name}</p>
            {item.size && (
              <p className="mt-0.5 text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">
                Size {item.size}
              </p>
            )}
            {meta && (
              <p className="mt-0.5 text-[0.65rem] text-black/40 dark:text-white/40">{meta}</p>
            )}
            {item.details?.note && (
              <p className="mt-0.5 text-[0.65rem] italic text-black/40 dark:text-white/40">“{item.details.note}”</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id, item.size)}
            aria-label={`Remove ${item.name}`}
            className="text-black/30 transition-colors hover:text-black dark:text-white/30 dark:hover:text-white"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center border border-black/15 dark:border-white/15">
            <button
              type="button"
              onClick={() => onUpdate(item.id, item.size, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center text-xs text-black dark:text-white">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdate(item.id, item.size, item.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              <Plus size={12} />
            </button>
          </div>
          <p className="text-sm text-black dark:text-white">{formatPrice(item.price * item.quantity)}</p>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { items, updateQuantity, removeFromCart, cartTotal, isCartOpen, closeCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  // Lock background scroll while the drawer is open.
  useEffect(() => {
    if (!isCartOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isCartOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e) => { if (e.key === "Escape") closeCart(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCartOpen, closeCart]);

  // TODO(stripe): replace this with a real checkout call once Stripe is wired up.
  // Plan: POST `items` to a Code.gs endpoint (or a small serverless function) that
  // creates a Stripe Checkout Session server-side using the secret key, then redirect
  // the browser to `session.url`. Never call Stripe's secret-key APIs from this file —
  // that key must never ship to the browser. On successful payment (Stripe webhook,
  // or the Checkout success_url), write the order to the Products sheet for records.
  function handleCheckout() {
    setCheckingOut(true);
    window.setTimeout(() => setCheckingOut(false), 1200);
  }

  return createPortal(
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-sm flex-col bg-white dark:bg-black"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-5 dark:border-white/10">
              <h2 className="font-['Playfair_Display'] text-lg text-black dark:text-white">Your cart</h2>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingBag size={28} className="text-black/20 dark:text-white/20" />
                  <p className="text-sm text-black/40 dark:text-white/40">Your cart is empty.</p>
                </div>
              ) : (
                items.map((item) => (
                  <CartLine
                    key={`${item.id}::${item.size}`}
                    item={item}
                    onUpdate={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/10 px-6 py-5 dark:border-white/10">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">Subtotal</span>
                  <span className="font-['Playfair_Display'] text-lg text-black dark:text-white">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="flex w-full items-center justify-center gap-2 border border-black bg-black px-6 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:opacity-60 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
                >
                  <CreditCard size={16} />
                  {checkingOut ? "One moment…" : "Proceed to Checkout"}
                </button>
                <p className="mt-3 text-center text-[0.65rem] text-black/40 dark:text-white/40">
                  Online payment is being set up. Checkout isn't live yet.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
