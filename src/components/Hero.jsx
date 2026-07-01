import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroMarquee from "./HeroMarquee";

import hero1 from "../assets/hero-1.jpg";
import hero2 from "../assets/hero-2.jpg";
import hero3 from "../assets/hero-3.jpg";
import hero4 from "../assets/hero-4.jpg";
import hero5 from "../assets/hero-5.jpg";
import hero6 from "../assets/hero-6.jpg";
import hero7 from "../assets/hero-7.jpg";
import hero8 from "../assets/hero-8.jpg";
import hero9 from "../assets/hero-9.jpg";
import hero10 from "../assets/hero-10.jpg";

const SLIDES = [
  hero1,
  hero2,
  hero3,
  hero4,
  hero5,
  hero6,
  hero7,
  hero8,
  hero9,
  hero10,
];
const SLIDE_DURATION = 5000;

function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, []);

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
              menswear with nothing left to chance.
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

        {/* Gallery — auto-rotating crossfade, bleeds off the right edge. Anchored to the full-width wrapper, not the max-w-7xl text column, so it fills the same area it always did. */}
        <div className="absolute -right-32 md:-right-32 lg:-right-30 top-1/2 -translate-y-1/2 w-[160%] sm:w-[110%] md:w-[75%] lg:w-[68%] aspect-[4/5] sm:aspect-[16/10] opacity-90 md:opacity-100 pointer-events-none select-none overflow-hidden">
          <AnimatePresence mode="sync">
            <motion.img
              key={index}
              src={SLIDES[index]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </AnimatePresence>

          {/* fade into background on the left edge so the gallery blends with the page */}
          <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-black from-0% via-white/10 dark:via-black/25 via-20% to-transparent to-40%" />
        </div>

        {/* Slide controls */}
        <div className="absolute bottom-8 right-8 z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Previous slide"
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60 transition-colors hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
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
            onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
            aria-label="Next slide"
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60 transition-colors hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <HeroMarquee message="Welcome to Santy Stitches" />
    </section>
  );
}

export default Hero;
