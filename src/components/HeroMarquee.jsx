import { useEffect, useMemo, useRef, useState } from "react";
import logo from "../assets/santy-stitches-logo-transparent.png";

import { useSiteData } from "../context/SiteDataContext";

// Constant scroll speed, in pixels per second. Duration is derived from the
// ACTUAL rendered width of the content (measured in the browser), not from
// message count — so 1 message and 30 messages both scroll at the same
// visual speed, just for different total durations.
const PIXELS_PER_SECOND = 60;
const DEFAULT_DURATION = 30; // used only for the first paint, before width is measured

function HeroMarquee() {
  // Marquee messages now come from the shared bootstrap fetch (see
  // SiteDataContext) instead of a separate fetch to its own hardcoded API
  // URL — that URL previously duplicated (and could drift from) the
  // API_URL used everywhere else in config.js.
  const { marqueeMessages, status: dataStatus } = useSiteData();
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const trackRef = useRef(null);

  const messages = useMemo(
    () =>
      Array.isArray(marqueeMessages)
        ? marqueeMessages.map((m) => (m.text || "").trim()).filter(Boolean)
        : [],
    [marqueeMessages]
  );

  // Measure the actual rendered width of one full set of messages (the
  // track holds two copies back to back, so half its scrollWidth is one
  // loop) and derive duration from that, so speed stays constant no matter
  // how many messages there are or how long the text is. Re-measures on
  // window resize since text can wrap/reflow at different widths.
  useEffect(() => {
    if (messages.length === 0) return;

    const measure = () => {
      if (!trackRef.current) return;
      const fullWidth = trackRef.current.scrollWidth / 2;
      if (fullWidth > 0) setDuration(fullWidth / PIXELS_PER_SECOND);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [messages]);

  // Nothing to show yet (still loading) or the sheet has no active
  // messages — render nothing.
  if (dataStatus === "loading" || messages.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden border-y border-black/10 dark:border-white/10 bg-white dark:bg-black py-4 transition-colors">
      <style>{`
        @keyframes santy-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <div
        ref={trackRef}
        className="flex items-center gap-10"
        style={{
          width: "max-content",
          whiteSpace: "nowrap",
          animation: `santy-marquee-scroll ${duration}s linear infinite`,
        }}
      >
        {[...messages, ...messages].map((text, i) => (
          <span
            key={i}
            className="flex items-center gap-10 shrink-0"
            style={{ whiteSpace: "nowrap" }}
          >
            <span
              className="text-xs font-medium uppercase tracking-[0.25em] text-black/70 dark:text-white/70"
              style={{ whiteSpace: "nowrap" }}
            >
              {text}
            </span>
            <img
              src={logo}
              alt=""
              className="object-contain dark:invert shrink-0"
              style={{ width: "36px", height: "36px", objectFit: "contain", flexShrink: 0 }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

export default HeroMarquee;
