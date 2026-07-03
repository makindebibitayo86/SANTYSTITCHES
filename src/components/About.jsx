import { useEffect, useLayoutEffect, useRef, useState } from "react";

const PILLARS = [
  {
    title: "Made To Order",
    body: "Nothing sits in a warehouse waiting to be sold. Every piece starts after you order it, not before.",
  },
  {
    title: "Small Batches",
    body: "Drops run tight and rarely repeat. Once a print or a cut sells out, it's retired for good.",
  },
  {
    title: "Fit Confirmed By Hand",
    body: "Sleeve, height, size — someone from the house actually reads your details before anything's cut.",
  },
];

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// Owner photo lives in the "About" tab of the sheet (uploaded from
// AdminAbout in the admin panel). No fallback placeholder — while loading
// (or if nothing's been uploaded yet), the caller shows a skeleton instead.
function useOwnerImage() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${APPS_SCRIPT_URL}?action=getAboutImage`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setImageUrl(data?.image?.imageUrl || null);
      })
      .catch((err) => {
        console.error("Failed to load owner photo:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { imageUrl, loading };
}

// The desktop grid layout is designed at (and intended to kick in at) the
// Tailwind "md" breakpoint. Rather than reflow into a stacked mobile layout
// below that width, we keep the exact desktop DOM/markup and render it at
// this fixed reference width, then scale the whole block down uniformly to
// fit narrower viewports — like a zoomed-out screenshot of the desktop
// design, not a different layout.
const DESKTOP_REFERENCE_WIDTH = 768;

function useDesktopZoom(referenceWidth) {
  const outerRef = useRef(null); // measures available width (respects section padding)
  const contentRef = useRef(null); // the fixed-width desktop content being scaled
  const [scale, setScale] = useState(1);
  const [wrapperHeight, setWrapperHeight] = useState(null);

  useLayoutEffect(() => {
    if (!outerRef.current) return;

    function update() {
      const availableWidth = outerRef.current.offsetWidth;
      const nextScale = Math.min(1, availableWidth / referenceWidth);
      setScale(nextScale);
      if (contentRef.current) {
        setWrapperHeight(contentRef.current.offsetHeight * nextScale);
      }
    }

    update();

    // ResizeObserver on the outer element catches viewport changes AND
    // layout changes from the section's own responsive padding — window
    // resize alone would miss the latter.
    const ro = new ResizeObserver(update);
    ro.observe(outerRef.current);

    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, [referenceWidth]);

  return { outerRef, contentRef, scale, wrapperHeight };
}

export default function About() {
  const { outerRef, contentRef, scale, wrapperHeight } = useDesktopZoom(DESKTOP_REFERENCE_WIDTH);
  const isScaled = scale < 1;
  const { imageUrl: ownerImage, loading: ownerImageLoading } = useOwnerImage();

  return (
    <section
      id="about"
      className="border-t border-black/10 bg-white px-[clamp(1.5rem,5vw,6rem)] py-[clamp(5rem,10vw,9rem)] transition-colors dark:border-white/10 dark:bg-black"
    >
      <div
        ref={outerRef}
        style={isScaled ? { height: wrapperHeight ?? undefined, overflow: "hidden" } : undefined}
      >
        <div
          ref={contentRef}
          style={
            isScaled
              ? {
                  width: DESKTOP_REFERENCE_WIDTH,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }
              : { maxWidth: 1400, marginLeft: "auto", marginRight: "auto" }
          }
        >
          {/* Header: portrait + story, side by side — always the desktop grid */}
          <div className="mb-20 grid grid-cols-[0.85fr_1.15fr] items-start gap-16">
            <div className="aspect-[4/5] w-full overflow-hidden bg-black/5 dark:bg-white/5">
              {ownerImage ? (
                <img
                  src={ownerImage}
                  alt="Founder of Santy Stitches"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={`h-full w-full bg-black/10 dark:bg-white/10 ${
                    ownerImageLoading ? "animate-pulse" : ""
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>

            <div>
              <span className="mb-4 block text-[0.7rem] uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
                The House
              </span>
              <h2 className="mb-6 font-['Playfair_Display'] text-[3.5rem] font-semibold leading-[1.05] text-black dark:text-white">
                Built Stitch By Stitch.
                <br />
                <span className="text-black/30 dark:text-white/30">Never Off The Rack.</span>
              </h2>
              <p className="mb-4 text-base leading-relaxed text-black/60 dark:text-white/60">
                Santy built the house on one belief: nothing leaves with his name on it unless it's
                original. Not inspired by, not adapted from — made from nothing but the idea itself.
              </p>
              <p className="mb-4 text-base leading-relaxed text-black/60 dark:text-white/60">
                The first piece to carry the wolf, the First Howl, set the standard every piece
                since has had to match. Authenticity first, quality without compromise, or it
                doesn't ship.
              </p>
              <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
                Out of Ibadan, Santy is building toward one thing: Nigerian craft, held to a
                standard the rest of the world has to take seriously.
              </p>
            </div>
          </div>

          {/* Stitch line + pillars — always the desktop 3-column grid */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-0 right-0 top-5 block w-full text-black/15 dark:text-white/15"
              height="12"
              preserveAspectRatio="none"
              viewBox="0 0 100 12"
            >
              <line
                x1="0"
                y1="6"
                x2="100"
                y2="6"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeDasharray="2.4 2.8"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="grid grid-cols-3 gap-10">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="relative pt-14">
                  <span className="absolute left-0 top-[0.85rem] block h-2.5 w-2.5 rounded-full border border-black/40 bg-white dark:border-white/40 dark:bg-black" />
                  <h3 className="mb-2 font-['Playfair_Display'] text-lg text-black dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-black/55 dark:text-white/55">
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Closing line */}
          <p className="mt-20 border-t border-black/10 pt-8 text-[0.7rem] uppercase tracking-[0.3em] text-black/40 dark:border-white/10 dark:text-white/40">
            Designed &amp; stitched in Ibadan
          </p>
        </div>
      </div>
    </section>
  );
}
