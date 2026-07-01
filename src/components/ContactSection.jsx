import { useEffect, useRef } from "react";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.113.548 4.1 1.508 5.83L0 24l6.335-1.647A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.823 9.823 0 01-5.006-1.366l-.36-.214-3.73.97.997-3.63-.235-.374A9.812 9.812 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.06 2c2.99 0 5.51 2.2 5.83 5.13.08.7.06 1.77.04 2.65l-.01.34c.02.04.18.13.51.16.42.05.92-.1 1.36-.27a.6.6 0 01.55.05c.18.12.28.31.27.51-.04.61-.69 1.07-1.96 1.4-.07.15-.05.51.07.92.16.08.49.16.96.16.36 0 .68.21.79.55.1.31-.01.65-.27.86-.39.31-1.34.69-2.78.9-.06.18-.16.6-.24.95-.1.45-.51.74-1 .69-.27-.03-.65-.06-1.07-.06-.61 0-1.07.13-1.6.46-.7.43-1.49.93-2.45.93s-1.75-.5-2.45-.93c-.53-.33-.99-.46-1.6-.46-.42 0-.8.03-1.07.06-.49.05-.9-.24-1-.69-.08-.35-.18-.77-.24-.95-1.44-.21-2.39-.59-2.78-.9-.26-.21-.37-.55-.27-.86.11-.34.43-.55.79-.55.47 0 .8-.08.96-.16.12-.41.14-.77.07-.92-1.27-.33-1.92-.79-1.96-1.4-.01-.2.09-.39.27-.51a.6.6 0 01.55-.05c.44.17.94.32 1.36.27.33-.03.49-.12.51-.16l-.01-.34c-.02-.88-.04-1.95.04-2.65C6.55 4.2 9.07 2 12.06 2z" />
  </svg>
);

const ArrowIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="cs-arrow"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── Contact Card ─────────────────────────────────────────────────────────────

const ContactCard = ({ href, icon, label, detail }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="cs-card group relative flex items-center gap-6 px-8 py-6 border overflow-hidden"
  >
    {/* Left accent bar */}
    <span className="cs-card-accent-bar absolute left-0 top-0 bottom-0 w-[2px]" aria-hidden="true" />

    {/* Icon */}
    <div className="cs-card-icon w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center border">
      {icon}
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <span className="cs-card-label block text-[0.85rem] font-normal mb-0.5 tracking-wide">
        {label}
      </span>
      <span className="cs-card-detail block text-[0.7rem] font-light truncate">
        {detail}
      </span>
    </div>

    {/* Arrow */}
    <ArrowIcon />
  </a>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContactSection() {
  const sectionRef = useRef(null);

  // Scroll-reveal: mirrors the original .reveal-up / .visible logic
  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal-up");
    if (!els?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const channels = [
    {
      href: "https://wa.me/2347031990126",
      icon: <WhatsAppIcon />,
      label: "WhatsApp Us",
      detail: "Quick response guaranteed",
    },
    {
      href: "https://instagram.com/santystitches",
      icon: <InstagramIcon />,
      label: "Follow on Instagram",
      detail: "@santystitches",
    },
    {
      href: "https://snapchat.com/add/santyxwolf",
      icon: <SnapchatIcon />,
      label: "Add on Snapchat",
      detail: "@santyxwolf",
    },
  ];

  return (
    <>
      {/* Inject reveal-up animation + CSS custom property theme tokens */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Barlow:wght@200;300;400&display=swap');

        /* ── Theme tokens ────────────────────────────────────────────────────────
           This project's theme logic (index.css):
             light mode = baseline (no class on <html>)
             dark mode  = .dark class added to <html>
           So light is the baseline here, and .dark overrides to dark tokens —
           opposite of the reference file, but same exact color values.
           ── */

        /* Default = light */
        :root {
          --cs-bg:            #ffffff;
          --cs-border:        rgba(0,0,0,0.1);
          --cs-accent:        #000000;
          --cs-accent-sub:    rgba(0,0,0,0.3);
          --cs-text-primary:  #000000;
          --cs-text-muted:    rgba(0,0,0,0.5);
          --cs-card-bg:       rgba(0,0,0,0.03);
          --cs-card-border:   rgba(0,0,0,0.12);
          --cs-card-bg-hover: rgba(0,0,0,0.06);
          --cs-card-bdr-hover:rgba(0,0,0,0.35);
          --cs-icon-border:   rgba(0,0,0,0.25);
        }

        /* Dark mode — .dark class on <html> */
        .dark {
          --cs-bg:            #000000;
          --cs-border:        rgba(255,255,255,0.1);
          --cs-accent:        #ffffff;
          --cs-accent-sub:    rgba(255,255,255,0.3);
          --cs-text-primary:  #ffffff;
          --cs-text-muted:    rgba(255,255,255,0.5);
          --cs-card-bg:       #242424;
          --cs-card-border:   rgba(255,255,255,0.18);
          --cs-card-bg-hover: #2e2e2e;
          --cs-card-bdr-hover:rgba(255,255,255,0.35);
          --cs-icon-border:   rgba(255,255,255,0.25);
        }

        .reveal-up {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.75s ease, transform 0.75s ease;
        }
        .reveal-up.visible {
          opacity: 1;
          transform: none;
        }
        .reveal-up.delay-1 { transition-delay: 0.15s; }

        /* ── Contact section themed styles ── */
        #contact {
          background-color: var(--cs-bg);
          border-top-color: var(--cs-border);
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .cs-eyebrow   { color: var(--cs-text-muted); }
        .cs-heading   { color: var(--cs-text-primary); }
        .cs-subheading{ color: var(--cs-accent-sub); }
        .cs-body      { color: var(--cs-text-muted); }

        .cs-card {
          background-color: var(--cs-card-bg);
          border-color: var(--cs-card-border);
          transition:
            background-color 0.4s ease,
            border-color 0.4s ease,
            transform 0.4s ease;
        }
        .cs-card:hover {
          background-color: var(--cs-card-bg-hover);
          border-color: var(--cs-card-bdr-hover);
          transform: translateX(4px);
        }

        .cs-card-accent-bar {
          background-color: var(--cs-accent);
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform 0.4s ease;
        }
        .cs-card:hover .cs-card-accent-bar { transform: scaleY(1); }

        .cs-card-icon {
          border-color: var(--cs-icon-border);
          color: var(--cs-accent);
        }

        .cs-card-label  { color: var(--cs-text-primary); }
        .cs-card-detail { color: var(--cs-text-muted); }

        .cs-arrow {
          color: var(--cs-text-muted);
          transition: transform 0.3s ease, color 0.3s ease;
          flex-shrink: 0;
        }
        .cs-card:hover .cs-arrow {
          transform: translateX(4px);
          color: var(--cs-accent);
        }
      `}</style>

      <section
        id="contact"
        ref={sectionRef}
        className="border-t px-[clamp(1.5rem,5vw,6rem)] py-[clamp(5rem,10vw,10rem)] font-['Barlow',sans-serif]"
      >
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.5fr] md:gap-24 items-center">

          {/* ── Left: Text ── */}
          <div className="reveal-up">
            <span className="cs-eyebrow block mb-4 text-[0.7rem] tracking-[0.22em] uppercase font-light">
              Join The Pack
            </span>

            <h2 className="cs-heading font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] mb-6">
              Lead Like
              <br />
              <em className="cs-subheading not-italic font-normal">
                An Alpha Wolf 🐾
              </em>
            </h2>

            <p className="cs-body leading-[1.8] text-[0.9rem] font-light">
              Ready to lead from the front? Reach out and let's build a piece
              that moves like you do — sharp, deliberate, unmistakably alpha.
            </p>
          </div>

          {/* ── Right: Contact Channels ── */}
          <div className="reveal-up delay-1 flex flex-col gap-px">
            {channels.map((ch) => (
              <ContactCard key={ch.label} {...ch} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
