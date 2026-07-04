import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import { useCart } from "../context/CartContext";
import { API_URL, PAYSTACK_PUBLIC_KEY } from "../config";

const PAYSTACK_SCRIPT_SRC = "https://js.paystack.co/v1/inline.js";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Loads Paystack's inline checkout script once and resolves once it's ready.
// Safe to call multiple times — later calls reuse the same in-flight/settled
// promise instead of injecting the <script> tag again.
let paystackScriptPromise = null;
function loadPaystackScript() {
  if (window.PaystackPop) return Promise.resolve();
  if (paystackScriptPromise) return paystackScriptPromise;

  paystackScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PAYSTACK_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Paystack script")));
      return;
    }
    const script = document.createElement("script");
    script.src = PAYSTACK_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script"));
    document.body.appendChild(script);
  });

  return paystackScriptPromise;
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
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState(""); // transient success/failure banner

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

  // Preload the Paystack script as soon as the drawer opens, so there's no
  // extra delay the first time the person hits "Pay now".
  useEffect(() => {
    if (isCartOpen) loadPaystackScript().catch(() => {});
  }, [isCartOpen]);

  function updateField(field, value) {
    setCustomer((c) => ({ ...c, [field]: value }));
    if (formError) setFormError("");
  }

  // Logs the checkout attempt the instant we're about to open the Paystack
  // popup, so it shows up in the Orders sheet as "pending" even if the
  // payment never actually completes (declined card, closed popup, dropped
  // connection). Best-effort — if this call fails we still let the person
  // pay rather than blocking checkout over a logging hiccup.
  async function createPendingOrder(reference, amountKobo, checkoutItems) {
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "createPendingOrder",
          reference,
          amount: amountKobo,
          order: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            items: checkoutItems.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size || "",
            })),
          },
        }),
      });
    } catch (err) {
      // Non-fatal — see comment above.
    }
  }

  // Fired when the customer closes the Paystack popup without completing
  // payment. Fire-and-forget: flips the pending row to "abandoned" so it
  // doesn't sit there looking like an active checkout forever.
  function abandonOrder(reference) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "abandonPaystackOrder", reference }),
    }).catch(() => {});
  }

  // Sends the Paystack reference to Code.gs so it can be re-verified
  // server-side (against Paystack's API, with the secret key) before any
  // order is recorded as paid. A "success" from the Paystack popup alone
  // is never treated as a completed sale.
  async function verifyOnServer(reference, amountKobo, checkoutItems) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        // Plain-text body, no Content-Type header — avoids a CORS preflight,
        // same pattern used for every other admin/order write in this app.
        body: JSON.stringify({
          action: "verifyPaystackPayment",
          reference,
          expectedAmount: amountKobo,
          order: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            items: checkoutItems.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size || "",
            })),
          },
        }),
      });
      const data = await res.json();

      if (data.ok && data.status === "amount_mismatch") {
        // Recorded, but flagged — don't tell the customer it failed (money
        // did move), just let them know to expect a follow-up.
        setStatusMessage("Payment received — we'll confirm your order shortly.");
        checkoutItems.forEach((item) => removeFromCart(item.id, item.size));
      } else if (data.ok) {
        setStatusMessage("Payment successful! We'll be in touch to confirm your order.");
        checkoutItems.forEach((item) => removeFromCart(item.id, item.size));
      } else {
        setStatusMessage(
          "We received your payment but couldn't confirm it automatically. Please contact us with your reference: " + reference
        );
      }
    } catch (err) {
      setStatusMessage(
        "We received your payment but couldn't confirm it automatically. Please contact us with your reference: " + reference
      );
    } finally {
      setCheckingOut(false);
    }
  }

  async function handleCheckout() {
    setFormError("");
    setStatusMessage("");

    const name = customer.name.trim();
    const email = customer.email.trim();
    if (!name) return setFormError("Please enter your name.");
    if (!email || !EMAIL_RE.test(email)) return setFormError("Please enter a valid email — Paystack sends your receipt there.");
    if (items.length === 0) return;

    setCheckingOut(true);

    try {
      await loadPaystackScript();
    } catch (err) {
      setCheckingOut(false);
      setFormError("Couldn't load the payment popup. Check your connection and try again.");
      return;
    }

    const amountKobo = Math.round(cartTotal * 100);
    const reference = `SS_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // Snapshot the cart at the moment checkout starts — the popup can stay
    // open for a while, and we want the items we verify/record to match
    // what was actually charged, not whatever the cart looks like later.
    const checkoutItems = items.map((item) => ({ ...item }));

    // Log this attempt as "pending" before the popup even opens, so it's
    // visible in the Orders sheet whether or not the payment goes through.
    await createPendingOrder(reference, amountKobo, checkoutItems);

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: amountKobo,
      currency: "NGN",
      ref: reference,
      metadata: {
        custom_fields: [
          { display_name: "Name", variable_name: "name", value: name },
          { display_name: "Phone", variable_name: "phone", value: customer.phone || "" },
        ],
      },
      callback: (response) => {
        // Paystack confirms the popup completed — this is NOT proof of
        // payment on its own, it just hands us a reference to verify.
        verifyOnServer(response.reference, amountKobo, checkoutItems);
      },
      onClose: () => {
        abandonOrder(reference);
        setCheckingOut(false);
      },
    });

    handler.openIframe();
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

                {statusMessage ? (
                  <p className="mb-3 text-center text-xs text-black dark:text-white">{statusMessage}</p>
                ) : (
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={customer.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full border border-black/15 bg-transparent px-3 py-2 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none dark:border-white/15 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white"
                    />
                    <input
                      type="email"
                      placeholder="Email (for your receipt)"
                      value={customer.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full border border-black/15 bg-transparent px-3 py-2 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none dark:border-white/15 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={customer.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="w-full border border-black/15 bg-transparent px-3 py-2 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none dark:border-white/15 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white"
                    />
                    {formError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
                    )}
                  </div>
                )}

                {!statusMessage && (
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="flex w-full items-center justify-center gap-2 border border-black bg-black px-6 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:opacity-60 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
                  >
                    <CreditCard size={16} />
                    {checkingOut ? "One moment…" : `Pay ${formatPrice(cartTotal)}`}
                  </button>
                )}

                <p className="mt-3 text-center text-[0.65rem] text-black/40 dark:text-white/40">
                  Secure payment via Paystack.
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
