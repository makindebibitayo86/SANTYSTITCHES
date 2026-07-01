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

export default function About() {
  return (
    <section
      id="about"
      className="border-t border-black/10 bg-white px-[clamp(1.5rem,5vw,6rem)] py-[clamp(5rem,10vw,9rem)] transition-colors dark:border-white/10 dark:bg-black"
    >
      <div className="mx-auto max-w-[1400px]">
        {/* Header: portrait + story, side by side */}
        <div className="mb-16 grid grid-cols-1 items-start gap-10 md:mb-20 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <div className="order-2 aspect-[4/5] w-full max-w-sm overflow-hidden bg-black/5 dark:bg-white/5 md:order-1 md:max-w-none">
            <img
              src={OWNER_IMAGE}
              alt="Founder of Santy Stitches"
              loading="lazy"
              className="h-full w-full object-cover grayscale"
            />
          </div>

          <div className="order-1 md:order-2">
            <span className="mb-4 block text-[0.7rem] uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
              The House
            </span>
            <h2 className="mb-6 font-['Playfair_Display'] text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[1.05] text-black dark:text-white">
              Built Stitch By Stitch.
              <br />
              <span className="text-black/30 dark:text-white/30">Never Off The Rack.</span>
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-black/60 dark:text-white/60 md:text-base">
              Santy used to fix his own clothes because tailors in Lagos kept getting his sleeves
              wrong. One afternoon, a friend saw the jacket he'd patched up himself and asked where
              he'd bought it.
            </p>
            <p className="mb-4 text-sm leading-relaxed text-black/60 dark:text-white/60 md:text-base">
              That question stuck. He borrowed a machine that weekend, pulled apart an old hoodie to
              learn how it was built, and sewed his first real piece by lamp light when the power
              went out.
            </p>
            <p className="mb-4 text-sm leading-relaxed text-black/60 dark:text-white/60 md:text-base">
              It sold before he'd even ironed it. Word moved faster than he could sew — so the house
              grew the only way that made sense: one order, one fit, one seam at a time.
            </p>
            <p className="mb-4 text-sm leading-relaxed text-black/60 dark:text-white/60 md:text-base">
              The name came before the logo did. Santy Stitches was just his name and what his hands
              did — but the mark needed to say something about how he worked. A wolf doesn't wait to
              be handed a pack; it moves alone until enough others start moving with it. That's how
              the label felt from the outside before it had a name for it.
            </p>
            <p className="mb-4 text-sm leading-relaxed text-black/60 dark:text-white/60 md:text-base">
              The first piece to wear the wolf properly was a bomber — stitched late, worn once
              before it even shipped, gone within a week. The house still calls it the First Howl.
              Everything since has carried some version of that same mark, quietly, on the inside
              seam or across the chest depending on the piece.
            </p>
            <p className="text-sm leading-relaxed text-black/60 dark:text-white/60 md:text-base">
              Santy still works the machine most nights, mostly alone. But every order that comes in
              — every sleeve length, every fit note sent over WhatsApp — is treated like it's joining
              something, not just buying something. That's the whole idea behind the Alpha Wolf mark:
              one maker, moving first, and a pack that grows one piece at a time.
            </p>
          </div>
        </div>

        {/* Stitch line + pillars */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-0 right-0 top-5 hidden w-full text-black/15 dark:text-white/15 md:block"
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

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="relative pl-0 md:pt-14">
                <span className="mb-4 hidden h-2.5 w-2.5 rounded-full border border-black/40 bg-white dark:border-white/40 dark:bg-black md:absolute md:left-0 md:top-[0.85rem] md:mb-0 md:block" />
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
        <p className="mt-16 border-t border-black/10 pt-8 text-[0.7rem] uppercase tracking-[0.3em] text-black/40 dark:border-white/10 dark:text-white/40 md:mt-20">
          Designed &amp; stitched in Lagos
        </p>
      </div>
    </section>
  );
}
