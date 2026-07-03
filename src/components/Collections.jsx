import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { API_URL } from "../config";

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

function ProductCard({ product, onOpen, big }) {
  const showTagBadge = product.tag && product.tag.toLowerCase() !== "new";

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="group relative block h-full w-full overflow-hidden bg-black/5 dark:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
    >
      <img
        src={product.image}
        alt={product.name}
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />

      {showTagBadge && (
        <span className="absolute left-3 top-3 border border-white/40 bg-black/50 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.15em] text-white backdrop-blur-sm">
          {product.tag}
        </span>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none" />

      <div className="absolute inset-x-4 bottom-4 translate-y-2 border border-white/25 bg-black/40 px-4 py-3 opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
        <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-white/60">
          {product.catalogNo}
        </span>
        <span
          className={`block font-['Playfair_Display'] text-white ${
            big ? "text-xl" : "text-base"
          }`}
        >
          {product.name}
        </span>
        <span className="mt-0.5 block text-[0.68rem] tracking-wide text-white/50">
          {product.meta}
        </span>
      </div>
    </button>
  );
}

function ProductModal({ product, onClose }) {
  if (!product) return null;

  const enquiryText = encodeURIComponent(
    `Hi, I'd like to enquire about ${product.name} (${product.catalogNo}). Is it available?`
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-2xl overflow-hidden border border-black/10 bg-white dark:border-white/10 dark:bg-black"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/90 transition-colors hover:bg-black/60 hover:text-white"
          >
            ✕
          </button>

          <div className="aspect-[4/5] w-full overflow-hidden md:aspect-[16/10]">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>

          <div className="p-8">
            <span className="mb-2 block text-[0.65rem] uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
              {product.catalogNo} · {product.meta}
            </span>
            <h3 className="mb-6 font-['Playfair_Display'] text-3xl font-semibold text-black dark:text-white">
              {product.name}
            </h3>
            <a
              href={`https://wa.me/2347031990126?text=${enquiryText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-black px-6 py-3 text-sm uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Splits products into trios and flips the "big card" side each trio.
// variant "left"  -> [big | small / small]
// variant "right" -> [small / small | big]
// Groups items into asymmetrical trios (big + small + small), alternating
// which side the big card sits on each group. If the item count doesn't
// divide evenly by 3, the final group wraps around and borrows from the
// front of the list — so the carousel never falls back to a flat, equal-
// width row just because the catalogue is small.
function buildTrios(items) {
  const n = items.length;
  if (n === 0) return [];
  if (n < 3) {
    // Not enough items to form a trio at all — handled as a special case
    // by the Trio component itself (single card / big+small pair).
    return [{ key: `trio-${items.map((p) => p.id).join("-")}`, items, variant: "left" }];
  }

  const trioCount = Math.ceil(n / 3);
  const trios = [];
  for (let t = 0; t < trioCount; t++) {
    const chunk = [items[(t * 3) % n], items[(t * 3 + 1) % n], items[(t * 3 + 2) % n]];
    trios.push({
      key: `trio-${t}-${chunk.map((p) => p.id).join("-")}`,
      items: chunk,
      variant: t % 2 === 0 ? "left" : "right",
    });
  }
  return trios;
}

function Trio({ trio, onOpen }) {
  const { items, variant } = trio;

  if (items.length === 1) {
    return (
      <div className="h-[460px] w-[600px] shrink-0">
        <ProductCard product={items[0]} onOpen={onOpen} big />
      </div>
    );
  }

  if (items.length === 2) {
    const [big, small] = variant === "left" ? items : [...items].reverse();
    return (
      <div className="flex h-[460px] w-[600px] shrink-0 gap-3">
        <div className={variant === "left" ? "order-1 h-full w-[62%]" : "order-2 h-full w-[62%]"}>
          <ProductCard product={big} onOpen={onOpen} big />
        </div>
        <div className={variant === "left" ? "order-2 h-full w-[38%]" : "order-1 h-full w-[38%]"}>
          <ProductCard product={small} onOpen={onOpen} />
        </div>
      </div>
    );
  }

  const [a, b, c] = items;
  const bigStyle = { gridRow: "1 / span 2", gridColumn: variant === "left" ? 1 : 2 };
  const smallTopStyle = { gridRow: 1, gridColumn: variant === "left" ? 2 : 1 };
  const smallBottomStyle = { gridRow: 2, gridColumn: variant === "left" ? 2 : 1 };

  return (
    <div
      className="grid h-[460px] w-[600px] shrink-0 gap-3"
      style={{ gridTemplateColumns: "1.4fr 1fr", gridTemplateRows: "1fr 1fr" }}
    >
      <div style={bigStyle}>
        <ProductCard product={a} onOpen={onOpen} big />
      </div>
      <div style={smallTopStyle}>
        <ProductCard product={b} onOpen={onOpen} />
      </div>
      <div style={smallBottomStyle}>
        <ProductCard product={c} onOpen={onOpen} />
      </div>
    </div>
  );
}

// Shimmer skeleton trio shown while the sheet is loading — no hardcoded
// fallback product data, just a shape-matched placeholder.
function TrioSkeleton({ variant }) {
  const bigStyle = { gridRow: "1 / span 2", gridColumn: variant === "left" ? 1 : 2 };
  const smallTopStyle = { gridRow: 1, gridColumn: variant === "left" ? 2 : 1 };
  const smallBottomStyle = { gridRow: 2, gridColumn: variant === "left" ? 2 : 1 };
  const pulse = "animate-pulse bg-black/10 dark:bg-white/10";

  return (
    <div
      className="grid h-[460px] w-[600px] shrink-0 gap-3"
      style={{ gridTemplateColumns: "1.4fr 1fr", gridTemplateRows: "1fr 1fr" }}
    >
      <div style={bigStyle} className={pulse} />
      <div style={smallTopStyle} className={pulse} />
      <div style={smallBottomStyle} className={pulse} />
    </div>
  );
}

export default function Collections() {
  const [tab, setTab] = useState("new");
  const [activeProduct, setActiveProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [trackEl, setTrackEl] = useState(null);
  const isPausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const isMobileViewport = useIsMobileViewport();

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
        if (!cancelled) setDataError(err.message || "Could not load the collection");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // "New Arrivals" -> only items tagged "new".
  // "The Archive"  -> everything, regardless of tag (new, hot, limited, bestseller...).
  const filtered = useMemo(
    () =>
      tab === "new"
        ? products.filter((p) => String(p.tag).toLowerCase() === "new")
        : products,
    [tab, products]
  );

  const trios = useMemo(() => buildTrios(filtered), [filtered]);
  const canLoop = trios.length > 1 && !isMobileViewport;
  const track = canLoop ? [...trios, ...trios] : trios;
  const durationSeconds = Math.max(20, trios.length * 8);

  // Drives the marquee by nudging scrollLeft on a real horizontally-
  // scrollable container (instead of a CSS transform), so touch devices
  // get native swipe/drag for free. Autoplay only runs on desktop —
  // on mobile it's purely swipe-driven (no auto-scroll, no looping).
  useEffect(() => {
    const el = trackEl;
    if (!el || !canLoop) return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    let rafId;
    let last = performance.now();

    function step(now) {
      const dt = (now - last) / 1000;
      last = now;
      if (!isPausedRef.current) {
        const halfWidth = el.scrollWidth / 2;
        const pxPerSecond = halfWidth / durationSeconds;
        el.scrollLeft += pxPerSecond * dt;
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }
      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [trackEl, canLoop, durationSeconds, tab, filtered.length]);

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

  return (
    <section
      id="collections"
      className="overflow-hidden bg-white px-[clamp(1.5rem,5vw,6rem)] py-[clamp(5rem,10vw,9rem)] transition-colors dark:bg-black"
    >
      <style>{`
        .collections-track {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .collections-track::-webkit-scrollbar {
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
        {/* Header + room toggle */}
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6 md:mb-20">
          <div>
            <span className="mb-4 block text-[0.7rem] uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
              The Collection
            </span>
            <h2 className="font-['Playfair_Display'] text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[1.05] text-black dark:text-white">
              New Drops.
              <br />
              <span className="text-black/30 dark:text-white/30">Classic Standards.</span>
            </h2>
          </div>

          <div className="flex gap-8 font-['Work_Sans']">
            <button
              type="button"
              onClick={() => setTab("new")}
              className={`border-b-2 pb-2 text-sm uppercase tracking-widest transition-colors ${
                tab === "new"
                  ? "border-black text-black dark:border-white dark:text-white"
                  : "border-transparent text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
              }`}
            >
              New Arrivals
            </button>
            <button
              type="button"
              onClick={() => setTab("archive")}
              className={`border-b-2 pb-2 text-sm uppercase tracking-widest transition-colors ${
                tab === "archive"
                  ? "border-black text-black dark:border-white dark:text-white"
                  : "border-transparent text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
              }`}
            >
              The Archive
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="-mx-[clamp(1.5rem,5vw,6rem)] overflow-hidden px-[clamp(1.5rem,5vw,6rem)]">
            <div className="flex gap-4">
              <TrioSkeleton variant="left" />
              <TrioSkeleton variant="right" />
              <TrioSkeleton variant="left" />
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && dataError && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-black/50 dark:text-white/50">
              Couldn't load the collection right now.
            </p>
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
          <p className="py-20 text-center text-sm text-black/40 dark:text-white/40">
            Nothing on display in this room yet.
          </p>
        )}

        {/* Gallery carousel */}
        {!loading && !dataError && filtered.length > 0 && (
          <div className="-mx-[clamp(1.5rem,5vw,6rem)] overflow-hidden px-[clamp(1.5rem,5vw,6rem)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                ref={setTrackEl}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="collections-track flex touch-pan-x gap-4 overflow-x-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
                onMouseEnter={pauseMarquee}
                onMouseLeave={() => resumeMarquee(0)}
                onTouchStart={pauseMarquee}
                onTouchEnd={() => resumeMarquee(1500)}
                onTouchCancel={() => resumeMarquee(1500)}
              >
                {track.map((trio, i) => (
                  <Trio key={`${trio.key}-${i}`} trio={trio} onOpen={setActiveProduct} />
                ))}
              </motion.div>
            </AnimatePresence>
            <div className="mt-3 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.15em] text-black/40 dark:text-white/40 md:hidden">
              <span>Swipe to explore</span>
              <span className="swipe-hint-icon inline-block">→</span>
            </div>
          </div>
        )}
      </div>

      <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} />
    </section>
  );
}
