import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroMarquee from "./HeroMarquee";

// Cap on how many images from the sheet will be shown, in case the sheet
// grows larger than intended. Set to null for no cap.
const MAX_SLIDES = null;

const SLIDE_DURATION = 5000;
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

function Hero() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("loading"); // "loading" | "loaded" | "error"

  // Fetch hero images from the sheet on mount. No local fallback — the
  // hero reflects loading/error state directly instead of masking it.
  useEffect(() => {
    let cancelled = false;

    async function loadHeroImages() {
      if (!APPS_SCRIPT_URL) {
        if (!cancelled) setStatus("error");
        return;
      }

      try {
        const res = await fetch(
          `${APPS_SCRIPT_URL}?action=getHeroImages`
        );
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = await res.json();
        let urls = Array.isArray(data?.images)
          ? data.images
              .filter((img) => img.active !== false && img.imageUrl)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((img) => img.imageUrl)
          : [];

        if (MAX_SLIDES) urls = urls.slice(0, MAX_SLIDES);

        if (cancelled) return;

        if (urls.length > 0) {
          setSlides(urls);
          setIndex(0);
          setStatus("loaded");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Failed to load hero images from sheet:", err);
        if (!cancelled) setStatus("error");
      }
    }

    loadHeroImages();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "loaded" || slides.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [status, slides.length]);

  return (
    <section className="relative overflow-hidden bg-white dark:bg-black transition-colors">
      <div className="relative min-h-[85vh]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-full min-h-[85vh] flex flex-col md:flex-row items-center">
          {/* Text */}
          <div className="relative z-10 w-full md:w-[42%] py-20 md:py-0 md:-ml-16 lg:-ml-24">
            <p className="text-xs tracking-[0.3em] uppercase text-black/50 dark:text-white/50 mb-6">
              Bespoke Menswear
            </p>
            <h1 className="font-['Playfair_Display'] text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] text-black dark:text-white">
              Style & Convenience
              <br />
              <span className="text-black/30 dark:text-white/30">More than mere Outfits.</span>
            </h1>
            <p className="font-['Work_Sans'] mt-6 max-w-sm text-black/60 dark:text-white/60">
              Every measurement exact. Every seam intentional. This is
              menswear with nothing left to chance stitch by stitch.
            </p>
            <div className="mt-10">
              <a
                href="#shop"
                className="inline-block text-sm tracking-widest uppercase border border-black dark:border-white px-7 py-3 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                Explore Collection
              </a>
            </div>
          </div>
        </div>

        {/* Gallery — auto-rotating crossfade. Fills the full remaining
            area (left edge fixed near where the text column ends, right
            edge flush with the viewport, full height of the hero) so
            there's no dead space above/below/right of the image.

            Photo uses object-cover so it fills the box completely at
            every edge — right, top, and bottom stay crisp with zero
            blur or gap. Only the left edge gets a thin fade/blur strip
            to dissolve into the text column; everything else is the
            plain, unblurred photo. */}
        <div className="absolute left-[36%] sm:left-[37%] md:left-[38%] lg:left-[36%] right-0 top-0 bottom-0 opacity-90 md:opacity-100 pointer-events-none select-none overflow-hidden">
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="h-8 w-8 rounded-full border-2 border-black/15 dark:border-white/15 border-t-black/60 dark:border-t-white/60 animate-spin" />
            </div>
          )}

          {status === "loaded" && (
            <AnimatePresence mode="sync">
              <motion.img
                key={index}
                src={slides[index]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>
          )}

          {/* Fade the LEFT EDGE ONLY into the page background — a thin
              strip (0-8% of box width), light blur. Masked so it never
              touches the right, top, or bottom edges. */}
          <div
            className="absolute inset-0 z-10 block dark:hidden"
            style={{
              background:
                "linear-gradient(to right, white 0%, rgba(255,255,255,0.15) 4%, rgba(255,255,255,0) 8%)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              maskImage: "linear-gradient(to right, black 0%, black 3%, transparent 8%)",
              WebkitMaskImage: "linear-gradient(to right, black 0%, black 3%, transparent 8%)",
            }}
          />
          <div
            className="absolute inset-0 z-10 hidden dark:block"
            style={{
              background:
                "linear-gradient(to right, black 0%, rgba(0,0,0,0.15) 4%, rgba(0,0,0,0) 8%)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              maskImage: "linear-gradient(to right, black 0%, black 3%, transparent 8%)",
              WebkitMaskImage: "linear-gradient(to right, black 0%, black 3%, transparent 8%)",
            }}
          />
        </div>

        {/* Slide controls */}
        {status === "loaded" && (
          <div className="absolute bottom-8 right-8 z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              aria-label="Previous slide"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60 transition-colors hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="pointer-events-auto py-1.5"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-500 ${
                      i === index
                        ? "w-6 bg-black dark:bg-white"
                        : "w-1.5 bg-black/25 dark:bg-white/25"
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              aria-label="Next slide"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60 transition-colors hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <HeroMarquee message="Welcome to Santy Stitches" />
    </section>
  );
}

export default Hero;
