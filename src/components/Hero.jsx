import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroMarquee from "./HeroMarquee";

import { useSiteData } from "../context/SiteDataContext";

// Cap on how many images from the sheet will be shown, in case the sheet
// grows larger than intended. Set to null for no cap.
const MAX_SLIDES = null;

const SLIDE_DURATION = 5000;

function Hero() {
  // Hero images now come from the shared bootstrap fetch (see
  // SiteDataContext) instead of Hero.jsx fetching getHeroImages on its own
  // — the backend already returns active-only slides sorted by sortOrder,
  // so no client-side filter/sort is needed here.
  const { heroImages, status: dataStatus } = useSiteData();
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => {
    let urls = Array.isArray(heroImages)
      ? heroImages.filter((img) => img.imageUrl).map((img) => img.imageUrl)
      : [];
    if (MAX_SLIDES) urls = urls.slice(0, MAX_SLIDES);
    return urls;
  }, [heroImages]);

  // "loading" while the shared fetch is in flight; once it resolves, no
  // slides means the same "error" state as before (nothing to show).
  const status = dataStatus === "loading" ? "loading" : slides.length > 0 ? "loaded" : "error";

  // Reset to the first slide whenever the slide set itself changes (e.g.
  // after a refetch following an admin edit).
  useEffect(() => {
    setIndex(0);
  }, [slides]);

  useEffect(() => {
    if (status !== "loaded" || slides.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [status, slides.length]);

  return (
    <section className="relative overflow-hidden bg-white dark:bg-black transition-colors">
      <div className="relative min-h-[85vh] flex flex-col">
        <div className="max-w-7xl mx-auto px-6 md:px-10 w-full flex-1 md:flex-none md:h-full md:min-h-[85vh] flex flex-col md:flex-row items-center">
          {/* Text — on mobile this grows (flex-1) to fill the hero's full
              height and distributes its groups (tagline / headline /
              paragraph+CTA) with space-between, so content uses the
              vertical space instead of clustering at the top with dead
              air below. flex-1/flex-grow is used instead of h-full
              because the ancestor only sets min-height, not height, so
              percentage heights don't resolve — flex growth doesn't have
              that problem. From md up this reverts to normal block flow
              (original layout). */}
          <div className="relative z-10 w-full md:w-[42%] flex-1 md:flex-none md:h-auto pt-8 pb-16 md:py-0 flex flex-col justify-center gap-8 md:block md:-ml-16 lg:-ml-24">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-white/80 md:text-black/50 md:dark:text-white/50 mb-3">
                Ritzy Bespoke Wears
              </p>
              <p className="text-xs tracking-[0.3em] uppercase text-white/50 md:text-black/30 md:dark:text-white/30 mb-3">
                Est X MMXI
              </p>
            </div>

            <h1 className="font-['Playfair_Display'] text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] text-white md:text-black md:dark:text-white">
              <span className="whitespace-nowrap">Style &amp;</span>
              <br />
              Convenience;
              <br />
              <span className="text-white/50 md:text-black/30 md:dark:text-white/30">
                Its More than<br className="md:hidden" /> Mere Outfits.
              </span>
            </h1>

            <div>
              <p className="font-['Work_Sans'] mt-6 md:mt-6 max-w-sm text-white/85 md:text-black/60 md:dark:text-white/60">
                Every measurement exact. Every seam intentional. This is
                menswear with nothing left to chance stitch by stitch.
              </p>
              <div className="mt-10">
                <a
                  href="#collections"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-block text-sm tracking-widest uppercase border px-7 py-3 transition-colors border-white text-white hover:bg-white hover:text-black md:border-black md:text-black md:hover:bg-black md:hover:text-white md:dark:border-white md:dark:text-white md:dark:hover:bg-white md:dark:hover:text-black"
                >
                  Explore Collection
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery — auto-rotating crossfade. Below md, this is the
            full-bleed background for the whole hero (text sits on top of
            it with a scrim behind for legibility). From md up it becomes
            the desktop split-screen treatment: left edge fixed near where
            the text column ends, right edge flush with the viewport, full
            height of the hero, so there's no dead space above/below/right
            of the image.

            Photo uses object-cover so it fills the box completely at
            every edge — right, top, and bottom stay crisp with zero
            blur or gap. Only the left edge gets a thin fade/blur strip
            (md and up only) to dissolve into the text column; everything
            else is the plain, unblurred photo. */}
        <div className="absolute inset-0 md:left-[38%] lg:left-[36%] pointer-events-none select-none overflow-hidden">
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

          {/* Below md, the photo is a full-bleed background — darken it
              with a scrim so the overlaid text stays legible regardless
              of what's in the photo. Not needed from md up, where the
              text moves onto the solid section background instead. */}
          <div className="absolute inset-0 md:hidden bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
          <div className="absolute inset-0 md:hidden bg-gradient-to-t from-black/55 via-transparent to-transparent" />

          {/* Fade the LEFT EDGE ONLY into the page background — a thin
              strip (0-8% of box width), light blur. Masked so it never
              touches the right, top, or bottom edges. md and up only —
              below md there's no adjacent solid-color column to fade
              into, since the photo is the full-bleed background. */}
          <div className="hidden md:block">
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
