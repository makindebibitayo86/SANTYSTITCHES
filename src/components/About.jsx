import { useLayoutEffect, useRef, useState } from "react";

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

const OWNER_IMAGE = "https://placehold.co/900x1100/111111/FFFFFF?text=Owner+Photo";

// The desktop grid layout is designed at (and intended to kick in at) the
// Tailwind "md" breakpoint. Rather than reflow into a stacked mobile layout
// below that width, we keep the exact desktop DOM/markup and just render it
// at this fixed reference width, then scale the whole block down uniformly
// to fit narrower viewports — like a zoomed-out screenshot of the desktop
// design, not a different layout.
const DESKTOP_REFERENCE_WIDTH = 768;

function useDesktopZoom(referenceWidth) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(() =>
    typeof window === "undefined" ? 1 : Math.min(1, window.innerWidth / referenceWidth)
  );
  const [wrapperHeight, setWrapperHeight] = useState(null);

  useLayoutEffect(() => {
    function update() {
      const nextScale = Math.min(1, window.innerWidth / referenceWidth);
      setScale(nextScale);
      if (contentRef.current) {
        setWrapperHeight(contentRef.current.offsetHeight * nextScale);
      }
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [referenceWidth]);

  return { wrapperRef, contentRef, scale, wrapperHeight };
}

export default function About() {
  const { wrapperRef, contentRef, scale, wrapperHeight } = useDesktopZoom(DESKTOP_REFERENCE_WIDTH);
  const isScaled = scale < 1;

  return (
    <section
      id="about"
      className="border-t border-black/10 bg-white px-[clamp(1.5rem,5vw,6rem)] py-[clamp(5rem,10vw,9rem)] transition-colors dark:border-white/10 dark:bg-black"
    >
      <div
        ref={wrapperRef}
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
              : undefined
          }
          className="mx-auto max-w-[1400px]"
        >
          {/* Header: portrait + story, side by side — always the desktop grid */}
          <div className="mb-20 grid grid-cols-[0.85fr_1.15fr] items-start gap-16">
            <div className="aspect-[4/5] w-full overflow-hidden bg-black/5 dark:bg-white/5">
              <img
                src={OWNER_IMAGE}
                alt="Founder of Santy Stitches"
                loading="lazy"
                className="h-full w-full object-cover grayscale"
              />
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
                Santy used to fix his own clothes because tailors in Lagos kept getting his sleeves
                wrong. One afternoon, a friend saw the jacket he'd patched up himself and asked where
                he'd bought it.
              </p>
              <p className="mb-4 text-base leading-relaxed text-black/60 dark:text-white/60">
                That question stuck. He borrowed a machine that weekend, pulled apart an old hoodie to
                learn how it was built, and sewed his first real piece by lamp light when the power
                went out.
              </p>
              <p className="mb-4 text-base leading-relaxed text-black/60 dark:text-white/60">
                It sold before he'd even ironed it. Word moved faster than he could sew — so the house
                grew the only way that made sense: one order, one fit, one seam at a time.
              </p>
              <p className="mb-4 text-base leading-relaxed text-black/60 dark:text-white/60">
                The name came before the logo did. Santy Stitches was just his name and what his hands
                did — but the mark needed to say something about how he worked. A wolf doesn't wait to
                be handed a pack; it moves alone until enough others start moving with it. That's how
                the label felt from the outside before it had a name for it.
              </p>
              <p className="mb-4 text-base leading-relaxed text-black/60 dark:text-white/60">
                The first piece to wear the wolf properly was a bomber — stitched late, worn once
                before it even shipped, gone within a week. The house still calls it the First Howl.
                Everything since has carried some version of that same mark, quietly, on the inside
                seam or across the chest depending on the piece.
              </p>
              <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
                Santy still works the machine most nights, mostly alone. But every order that comes in
                — every sleeve length, every fit note sent over WhatsApp — is treated like it's joining
                something, not just buying something. That's the whole idea behind the Alpha Wolf mark:
                one maker, moving first, and a pack that grows one piece at a time.
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
            Designed &amp; stitched in Lagos
          </p>
        </div>
      </div>
    </section>
  );
}
