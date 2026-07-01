import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/santy-stitches-logo-transparent.png";
import alphaWolfBlack from "../assets/alpha-wolf-black.png";
import alphaWolfWhite from "../assets/alpha-wolf-white.png";

const FOOTER_LINKS = {
  Explore: [
    { label: "Home", href: "#home" },
    { label: "Shop", href: "#shop" },
    { label: "Collections", href: "#collections" },
    { label: "Contact", href: "#contact" },
  ],
  Company: [
    { label: "About Santy Stitches", href: "#about" },
    { label: "Our Story", href: "#story" },
    { label: "The Workshop", href: "#workshop" },
    { label: "Care Guide", href: "#care" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Use", href: "#terms" },
    { label: "Shipping & Returns", href: "#shipping" },
    { label: "Admin", href: "/admin" },
  ],
};

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com/santystitches",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/2347031990126",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.113.548 4.1 1.508 5.83L0 24l6.335-1.647A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.823 9.823 0 01-5.006-1.366l-.36-.214-3.73.97.997-3.63-.235-.374A9.812 9.812 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
      </svg>
    ),
  },
  {
    label: "Snapchat",
    href: "https://snapchat.com/add/santyxwolf",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.06 2c2.99 0 5.51 2.2 5.83 5.13.08.7.06 1.77.04 2.65l-.01.34c.02.04.18.13.51.16.42.05.92-.1 1.36-.27a.6.6 0 01.55.05c.18.12.28.31.27.51-.04.61-.69 1.07-1.96 1.4-.07.15-.05.51.07.92.16.08.49.16.96.16.36 0 .68.21.79.55.1.31-.01.65-.27.86-.39.31-1.34.69-2.78.9-.06.18-.16.6-.24.95-.1.45-.51.74-1 .69-.27-.03-.65-.06-1.07-.06-.61 0-1.07.13-1.6.46-.7.43-1.49.93-2.45.93s-1.75-.5-2.45-.93c-.53-.33-.99-.46-1.6-.46-.42 0-.8.03-1.07.06-.49.05-.9-.24-1-.69-.08-.35-.18-.77-.24-.95-1.44-.21-2.39-.59-2.78-.9-.26-.21-.37-.55-.27-.86.11-.34.43-.55.79-.55.47 0 .8-.08.96-.16.12-.41.14-.77.07-.92-1.27-.33-1.92-.79-1.96-1.4-.01-.2.09-.39.27-.51a.6.6 0 01.55-.05c.44.17.94.32 1.36.27.33-.03.49-.12.51-.16l-.01-.34c-.02-.88-.04-1.95.04-2.65C6.55 4.2 9.07 2 12.06 2z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com/santystitches",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" />
        <line x1="19.5" y1="4.5" x2="4.5" y2="19.5" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@santyxwolf",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="5.5" width="20" height="13" rx="4" ry="4" />
        <polygon points="10,9.5 16,12 10,14.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:santystitchesaw@gmail.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

const MODAL_CONTENT = {
  "About Santy Stitches": {
    sub: "Cut with instinct.",
    heading: "About Santy Stitches",
    body: `Santy Stitches is a menswear label built on a single idea: a garment should move with sharp, deliberate purpose — the way the wearer does.\n\nEvery piece is shaped with precision, from first cut to final stitch. No shortcuts on the things that actually show — the line of a shoulder, the fall of a hem, the way a seam holds after a hundred wears.`,
    items: [
      "Bespoke commissions & made-to-measure",
      "In-house cutting & tailoring",
      "Premium fabrics, carefully sourced",
      "Personal styling consultations",
      "Limited ready-to-wear drops",
      "Sharp, modern silhouettes",
    ],
  },
  "Our Story": {
    sub: "Built on instinct, not trend.",
    heading: "Our Story",
    body: `Santy Stitches started with a simple conviction — that clothing should be cut with the same sharpness and intent as the people who wear it. No noise, no excess, just precision.\n\nThat standard hasn't moved. Every commission, whether it's a single piece or a full wardrobe, gets the same attention to detail the first one did.`,
    items: [
      "Founded on precision tailoring",
      "Built on instinct and craft",
      "Every piece cut to the individual",
      "Growing community of loyal clients",
      "Modern fits, timeless discipline",
      "Now dressing clients across Nigeria",
    ],
  },
  "The Workshop": {
    sub: "Where the work happens.",
    heading: "The Workshop",
    body: `Every commission moves through the same disciplined process: precise measurements, a hand-cut pattern, a fitting to catch what only a body in the garment reveals, and a final check before it leaves the workshop.\n\nNothing ships until it's right — that's the whole philosophy.`,
    items: [
      "Measurements taken in person or remotely",
      "Hand-cut patterns, no shortcuts",
      "Multiple fittings on bespoke pieces",
      "Hand-finished seams & buttonholes",
      "Quality control on every commission",
      "Average turnaround: 2–3 weeks",
    ],
  },
  "Care Guide": {
    sub: "Keep it sharp.",
    heading: "Care Guide",
    body: `A well-made garment rewards a little discipline. Tailored pieces are built to last years, not seasons — but only if they're treated like it.\n\nFollow these basics and your pieces will hold their shape, colour, and structure far longer than anything off a rack.`,
    items: [
      "Dry clean tailored pieces only",
      "Steam — avoid ironing directly on fabric",
      "Store on proper shaped hangers",
      "Rotate wear to extend garment life",
      "Address loose threads immediately",
      "Professional pressing every 3–4 wears",
    ],
  },
  "Privacy Policy": {
    sub: "Your data. Handled with care.",
    heading: "Privacy Policy",
    body: `Last updated: June 2026\n\nSanty Stitches ("we", "us", "our") collects only the information needed to process commissions, measurements, and orders — name, contact details, and any body measurements submitted for fitting purposes.\n\nWe do not sell or share your data with third parties. Measurement records are stored securely and used solely to fulfil your order. You can request deletion of your data at any time by contacting us directly.`,
    items: [
      "No data sold to third parties",
      "Measurements stored securely & privately",
      "Used only for order & commission processing",
      "Email communications are opt-in",
      "Data deletion available on request",
      "Contact: santystitchesaw@gmail.com",
    ],
  },
  "Terms of Use": {
    sub: "Clear terms. No surprises.",
    heading: "Terms of Use",
    body: `Last updated: June 2026\n\nBy using this site or commissioning a piece from Santy Stitches, you agree to these terms. Bespoke commissions are made to the measurements and specifications provided by the client at the time of order.\n\nAll content on this site — including photography, copy, and design — is the property of Santy Stitches and may not be reproduced without permission. Production timelines are estimates and may vary based on fabric availability and order volume.`,
    items: [
      "Bespoke pieces are made to submitted measurements",
      "All content © Santy Stitches",
      "No reproduction without permission",
      "Timelines are estimates, not guarantees",
      "Disputes resolved via direct contact",
      "Nigerian law governs these terms",
    ],
  },
  "Shipping & Returns": {
    sub: "What to expect after you order.",
    heading: "Shipping & Returns",
    body: `Bespoke and made-to-measure commissions are cut specifically to your measurements and are non-returnable once production has started, except in the case of a confirmed fitting or workmanship error.\n\nReady-to-wear pieces can be returned unworn, with tags attached, within 7 days of delivery. Delivery timelines are confirmed at checkout.`,
    items: [
      "Bespoke orders are non-returnable once cut",
      "Ready-to-wear: 7-day return window, unworn",
      "Fitting or workmanship issues resolved free of charge",
      "Nationwide shipping available",
      "Tracking sent once your order ships",
      "Contact us for delivery estimates",
    ],
  },
};

function BrandMark({ size = "h-12 w-auto" }) {
  return (
    <img src={logo} alt="Santy Stitches" className={`${size} object-contain object-left dark:invert transition-all`} />
  );
}

function AlphaWolfMark({ size = "h-16 w-auto" }) {
  return (
    <>
      <img src={alphaWolfBlack} alt="Alpha Wolf" className={`${size} object-contain object-left block dark:hidden transition-all`} />
      <img src={alphaWolfWhite} alt="Alpha Wolf" className={`${size} object-contain object-left hidden dark:block transition-all`} />
    </>
  );
}

function FooterModal({ id, onClose }) {
  const content = MODAL_CONTENT[id];
  if (!content) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="relative max-h-[88vh] w-full max-w-[720px] overflow-y-auto border border-black/10 dark:border-white/10 bg-white dark:bg-black [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="sticky top-0 z-[1] flex items-center justify-between px-8 pt-6 pb-2 bg-white dark:bg-black">
            <BrandMark size="h-7 w-auto" />
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-[1.1rem] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="px-10 pb-12 pt-4">
            <p className="mb-4 text-[0.7rem] uppercase tracking-[0.22em] text-black/50 dark:text-white/50">
              {content.sub}
            </p>
            <h2 className="mb-6 text-[clamp(2.2rem,5vw,3.2rem)] font-bold leading-[1.1] text-black dark:text-white">
              {content.heading}
            </h2>
            <div className="mb-8 h-px bg-gradient-to-r from-black/30 dark:from-white/30 to-transparent" />

            <div className="mb-8">
              {content.body.split("\n\n").map((para, i) => (
                <p key={i} className="mb-5 text-[0.92rem] leading-[1.8] text-black/70 dark:text-white/70">
                  {para}
                </p>
              ))}
            </div>

            {content.items && (
              <ul className="mb-2 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {content.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-2.5 text-[0.85rem] text-black/60 dark:text-white/60"
                  >
                    <span className="text-[0.45rem] text-black/40 dark:text-white/40">◆</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const MODAL_KEYS = new Set(Object.keys(MODAL_CONTENT));

export default function Footer() {
  const year = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState(null);

  const handleNavClick = (e, href) => {
    if (!href.startsWith("#") || MODAL_KEYS.has(href)) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-black px-[clamp(1rem,3vw,3rem)] pb-12 pt-16 md:pt-24 transition-colors">
      <div className="mx-auto max-w-[1400px]">
        {/* Top: brand + nav columns */}
        <div className="mb-20 grid grid-cols-1 gap-16 md:grid-cols-[1fr_1.6fr] md:gap-24">
          {/* Brand */}
          <div className="flex flex-col items-start gap-3">
            <div className="flex flex-nowrap items-end gap-6">
              <BrandMark size="h-20 w-auto shrink-0" />
              <AlphaWolfMark size="h-[7.5rem] w-auto shrink-0" />
            </div>

            <p className="max-w-full md:max-w-[380px] text-[0.95rem] font-light leading-[1.8] text-black/70 dark:text-white/70">
              We don't just take your measurements
              <br />
              We understand the assignment
              <br />
              We deliver on it, every single time.
            </p>

            <div className="mt-1 flex gap-[10px]">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target={s.external ? "_blank" : undefined}
                  rel={s.external ? "noopener noreferrer" : undefined}
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-black/15 dark:border-white/15 text-black/60 dark:text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white"
                >
                  <span className="h-[18px] w-[18px]">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <nav className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-12" aria-label="Footer navigation">
            {Object.entries(FOOTER_LINKS).map(([group, links]) => (
              <div
                key={group}
                className={
                  group === "Legal"
                    ? "col-span-2 grid grid-cols-2 gap-x-10 gap-y-4 border-t border-black/10 dark:border-white/10 pt-8 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0"
                    : undefined
                }
              >
                <h3
                  className={
                    group === "Legal"
                      ? "col-span-2 mb-7 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-black/50 dark:text-white/50 sm:col-span-1"
                      : "mb-7 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-black/50 dark:text-white/50"
                  }
                >
                  {group}
                </h3>
                <ul className="flex flex-col gap-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      {MODAL_KEYS.has(link.label) ? (
                        <button
                          onClick={() => setActiveModal(link.label)}
                          className="text-left text-[0.88rem] font-light text-black/60 dark:text-white/60 transition-colors duration-300 hover:text-black dark:hover:text-white"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          onClick={(e) => handleNavClick(e, link.href)}
                          className="text-[0.88rem] font-light text-black/60 dark:text-white/60 transition-colors duration-300 hover:text-black dark:hover:text-white"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="mb-11 h-px bg-gradient-to-r from-transparent via-black/15 dark:via-white/15 to-transparent" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-2 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-[0.8rem] font-light text-black/50 dark:text-white/50">
            © {year} SANTY STITCHES. All rights reserved.
          </p>
          <p className="text-[0.8rem] font-light text-black/50 dark:text-white/50">
            Cut with instinct. Made in Nigeria.
          </p>
        </div>
      </div>

      {activeModal && <FooterModal id={activeModal} onClose={() => setActiveModal(null)} />}
    </footer>
  );
}
