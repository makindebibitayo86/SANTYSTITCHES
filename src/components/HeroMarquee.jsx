import logo from "../assets/santy-stitches-logo-transparent.png";

function HeroMarquee({ message = "Welcome to Santy Stitches" }) {
  const items = Array(8).fill(message);

  return (
    <div className="relative w-full overflow-hidden border-y border-black/10 dark:border-white/10 bg-white dark:bg-black py-4 transition-colors">
      <style>{`
        @keyframes santy-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .santy-marquee-track {
          animation: santy-marquee-scroll 22s linear infinite;
        }
      `}</style>

      <div
        className="santy-marquee-track flex items-center gap-10"
        style={{ width: "max-content", whiteSpace: "nowrap" }}
      >
        {[...items, ...items].map((text, i) => (
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
