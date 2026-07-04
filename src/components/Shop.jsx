import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { API_URL } from "../config";
import { useCart } from "../context/CartContext";

// Tracks whether the viewport is "mobile" width, reacting to resize/rotate.
function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return isMobile;
}

const CATEGORIES = ["All", "Casual", "Corporate", "Streetwear", "Athleisure", "Caftan", "Accessories"];
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "";
  return `₦${Number(price).toLocaleString()}`;
}

/* ---------------------------------------------------------- */
/* Order modal — gallery + dynamic fit form, posts to Orders  */
/* ---------------------------------------------------------- */

function OrderModal({ item, onClose }) {
  const { addToCart, openCart } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [form, setForm] = useState({ sleeve: "", size: "", height: "", age: "", note: "" });

  useEffect(() => {
    if (!item) return;
    document.body.style.overflow = "hidden";
    setAdded(false);
    setActiveImg(0);
    setForm({ sleeve: "", size: "", height: "", age: "", note: "" });
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  if (!item) return null;

  const images = [item.image, ...(item.gallery || [])].filter(Boolean);
  const has = (f) => (item.fields || []).includes(f);
  const availableSizes = item.sizes && item.sizes.length > 0 ? item.sizes : DEFAULT_SIZES;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAddToCart = () => {
    const details = {
      sleeve: form.sleeve,
      height: form.height,
      age: form.age,
      note: form.note,
    };
    addToCart(
      { id: item.id, name: item.name, price: item.price, image: item.image },
      form.size,
      1,
      details
    );
    setAdded(true);
    openCart();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/85 backdrop-blur-sm md:items-center md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdrop}
      >
        <motion.div
          className="relative grid max-h-[96vh] w-full max-w-4xl grid-cols-1 overflow-y-auto border border-black/10 bg-white dark:border-white/10 dark:bg-black md:grid-cols-2 md:overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/90 transition-colors hover:bg-black/70 hover:text-white"
          >
            ✕
          </button>

          {/* Gallery */}
          <div className="flex flex-col gap-3 p-5 md:overflow-y-auto md:p-6">
            <div className="aspect-[4/5] w-full overflow-hidden bg-black/5 dark:bg-white/5">
              <img
                src={images[activeImg] || images[0]}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden border transition-colors ${
                      activeImg === i
                        ? "border-black dark:border-white"
                        : "border-black/10 opacity-60 hover:opacity-100 dark:border-white/10"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info + fit form */}
          <div className="flex h-full flex-col p-5 md:overflow-y-auto md:p-8">
            <span className="mb-1 block text-[0.65rem] uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
              {item.category}
            </span>
            <h3 className="mb-2 font-['Playfair_Display'] text-2xl font-semibold text-black dark:text-white">
              {item.name}
            </h3>
            <p className="mb-4 font-['Playfair_Display'] text-xl text-black dark:text-white">
              {formatPrice(item.price)}
            </p>
            {item.description && (
              <p className="mb-6 text-sm leading-relaxed text-black/60 dark:text-white/60">
                {item.description}
              </p>
            )}

            {!item.inStock && (
              <p className="mb-4 border border-black/20 bg-black/5 px-3 py-2 text-xs uppercase tracking-widest text-black/50 dark:border-white/20 dark:bg-white/5 dark:text-white/50">
                Currently unavailable — check back for restock
              </p>
            )}

            <div className="flex flex-col gap-4 font-['Work_Sans']">
              {/* Size — always shown and required, regardless of item.fields */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
                  Size <span className="normal-case text-black/30 dark:text-white/30">(required)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setForm({ ...form, size: form.size === s ? "" : s })}
                      className={`h-9 w-9 border text-xs transition-colors ${
                        form.size === s
                          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-black/15 text-black/60 hover:border-black/40 dark:border-white/15 dark:text-white/60 dark:hover:border-white/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {(has("sleeve") || has("height") || has("age") || has("note")) && (
                <p className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40">
                  Tailor your fit <span className="normal-case text-black/30 dark:text-white/30">(all optional)</span>
                </p>
              )}

              {has("sleeve") && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
                    Sleeve preference
                  </label>
                  <div className="flex gap-2">
                    {["Short sleeve", "Long sleeve"].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setForm({ ...form, sleeve: form.sleeve === s ? "" : s })}
                        className={`border px-3 py-2 text-xs uppercase tracking-wide transition-colors ${
                          form.sleeve === s
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-black/15 text-black/60 hover:border-black/40 dark:border-white/15 dark:text-white/60 dark:hover:border-white/40"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {has("height") && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
                    Height <span className="normal-case text-black/30 dark:text-white/30">(cm or ft)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. 175cm or 5'9"`}
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className="border border-black/15 bg-transparent px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
                  />
                </div>
              )}

              {has("age") && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
                    Age <span className="normal-case text-black/30 dark:text-white/30">(helps with fit)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="border border-black/15 bg-transparent px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
                  />
                </div>
              )}

              {has("note") && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
                    Any requests <span className="normal-case text-black/30 dark:text-white/30">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Custom print, colour preference, gift wrapping…"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="border border-black/15 bg-transparent px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!item.inStock || !form.size}
              className="mt-auto flex items-center justify-center gap-2 border border-black bg-black px-6 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
            >
              {added ? "Added ✓" : !item.inStock ? "Add to Cart" : !form.size ? "Select a size" : "Add to Cart"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


/* ---------------------------------------------------------- */
/* Product card                                                */
/* ---------------------------------------------------------- */

function ShopCard({ product, onOpen }) {
  return (
    <div
      onClick={() => onOpen(product)}
      className="group w-[280px] shrink-0 cursor-pointer snap-start border border-black/10 bg-black/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-black/30 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/30"
    >
      <div className="relative h-[340px] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
            !product.inStock ? "grayscale" : ""
          }`}
        />
        {product.tag && (
          <span className="absolute left-3 top-3 bg-black px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.15em] text-white dark:bg-white dark:text-black">
            {product.tag}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3 border border-white/60 px-2 py-1 text-[0.6rem] uppercase tracking-widest text-white">
            Sold Out
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="p-4">
        <span className="mb-1 block text-[0.62rem] uppercase tracking-[0.18em] text-black/40 dark:text-white/40">
          {product.category}
        </span>
        <h3 className="mb-1 font-['Playfair_Display'] text-lg leading-tight text-black dark:text-white">
          {product.name}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-['Playfair_Display'] text-base text-black dark:text-white">
            {formatPrice(product.price)}
          </span>
          <span className="border border-black/20 px-3 py-1.5 text-[0.65rem] uppercase tracking-widest text-black/70 transition-colors group-hover:border-black group-hover:text-black dark:border-white/20 dark:text-white/70 dark:group-hover:border-white dark:group-hover:text-white">
            View →
          </span>
        </div>
      </div>
    </div>
  );
}

function ShopCardSkeleton() {
  const pulse = "animate-pulse bg-black/10 dark:bg-white/10";
  return (
    <div className="w-[280px] shrink-0 border border-black/10 dark:border-white/10">
      <div className={`h-[340px] ${pulse}`} />
      <div className="flex flex-col gap-2 p-4">
        <div className={`h-2.5 w-2/5 ${pulse}`} />
        <div className={`h-4 w-3/4 ${pulse}`} />
        <div className={`mt-2 h-5 w-1/3 ${pulse}`} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Shop                                                         */
/* ---------------------------------------------------------- */

export default function Shop() {
  const [active, setActive] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openItem, setOpenItem] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setDataError(null);
      try {
        const res = await fetch(`${API_URL}?action=list`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Failed to load products");
        if (!cancelled) setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) setDataError(err.message || "Could not load the shop");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const filtered = useMemo(
    () =>
      active === "All"
        ? products
        : products.filter(
            (p) => String(p.category || "").trim().toLowerCase() === active.toLowerCase()
          ),
    [active, products]
  );

  const trackRef = useRef(null);
  const isPausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const isMobileViewport = useIsMobileViewport();

  const canLoop = filtered.length > 1 && !isMobileViewport;
  const track = canLoop ? [...filtered, ...filtered] : filtered;
  const durationSeconds = Math.max(8, filtered.length * 3);

  // Drives the marquee by nudging scrollLeft on a real horizontally-
  // scrollable container (instead of a CSS transform), so touch devices
  // get native swipe/drag for free. Autoplay only runs on desktop —
  // on mobile it's purely swipe-driven (no auto-scroll, no looping).
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !canLoop) return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    let rafId;
    let last = performance.now();
    el.scrollLeft = el.scrollWidth / 2;

    function step(now) {
      const dt = (now - last) / 1000;
      last = now;
      if (!isPausedRef.current) {
        const halfWidth = el.scrollWidth / 2;
        const pxPerSecond = halfWidth / durationSeconds;
        el.scrollLeft -= pxPerSecond * dt;
        if (el.scrollLeft <= 0) {
          el.scrollLeft += halfWidth;
        }
      }
      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [canLoop, durationSeconds, active, filtered.length]);

  function pauseMarquee() {
    isPausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }

  function resumeMarquee(delay = 1200) {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, delay);
  }

  useEffect(
    () => () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = canLoop ? el.scrollWidth / 2 : 0;
  }, [active, canLoop]);

  return (
    <section
      id="shop"
      className="border-t border-black/10 bg-white px-[clamp(1.5rem,5vw,6rem)] py-[clamp(5rem,10vw,9rem)] transition-colors dark:border-white/10 dark:bg-black"
    >
      <style>{`
        .shop-track {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .shop-track::-webkit-scrollbar {
          display: none;
        }
        @keyframes swipeHintNudge {
          0%, 100% { transform: translateX(0); opacity: 0.6; }
          50% { transform: translateX(5px); opacity: 1; }
        }
        .swipe-hint-icon {
          animation: swipeHintNudge 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .swipe-hint-icon {
            animation: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1400px]">
        <span className="mb-4 block text-[0.7rem] uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
          Official Store
        </span>
        <h2 className="mb-4 font-['Playfair_Display'] text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[1.05] text-black dark:text-white">
          Shop the House.
        </h2>
        <p className="mb-8 max-w-md text-sm text-black/50 dark:text-white/50">
          Every piece, made to order. Browse by category and let us know your fit.
        </p>

        {/* Filters */}
        <div className="mb-10 flex flex-wrap gap-2 font-['Work_Sans']">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                active === cat
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/15 text-black/60 hover:border-black/40 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Error state */}
        {!loading && dataError && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-black/50 dark:text-white/50">Couldn't load the shop right now.</p>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="border border-black px-5 py-2.5 text-sm uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !dataError && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-black/40 dark:text-white/40">
            Nothing in this category yet.
          </p>
        )}

        {/* Scroll strip */}
        {(loading || (!dataError && filtered.length > 0)) && (
          <div className="-mx-[clamp(1.5rem,5vw,6rem)] overflow-hidden px-[clamp(1.5rem,5vw,6rem)] pb-3">
            <div
              ref={trackRef}
              className="shop-track flex touch-pan-x gap-4 overflow-x-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
              onMouseEnter={pauseMarquee}
              onMouseLeave={() => resumeMarquee(0)}
              onTouchStart={pauseMarquee}
              onTouchEnd={() => resumeMarquee(1500)}
              onTouchCancel={() => resumeMarquee(1500)}
            >
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ShopCardSkeleton key={i} />)
                : track.map((product, i) => (
                    <ShopCard key={`${product.id}-${i}`} product={product} onOpen={setOpenItem} />
                  ))}
            </div>
            {!loading && (
              <div className="mt-3 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.15em] text-black/40 dark:text-white/40 md:hidden">
                <span>Swipe to explore</span>
                <span className="swipe-hint-icon inline-block">→</span>
              </div>
            )}
          </div>
        )}

        {/* Bulk / custom order CTA */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-8 dark:border-white/10">
          <p className="text-sm text-black/50 dark:text-white/50">
            Want a custom order or bulk gear for your team?
          </p>
          <a
            href="https://wa.me/2347031990126?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20a%20custom%20or%20bulk%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="border border-black bg-black px-6 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
          >
            Get in Touch
          </a>
        </div>
      </div>

      <OrderModal item={openItem} onClose={() => setOpenItem(null)} />
    </section>
  );
}
