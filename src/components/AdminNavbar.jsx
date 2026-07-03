import { useState } from "react";
import logo from "../assets/santy-stitches-logo-transparent.png";

const logoutIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const sunIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const moonIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// The `dark` class on <html> is already set before this app mounts (site-wide
// theme init runs first), so this just reads + flips that existing class —
// no separate context/provider needed for the toggle to work from in here.
function useAdminTheme() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return [isDark, toggle];
}

function AdminNavbar({ onLogout }) {
  const [isDark, toggleTheme] = useAdminTheme();

  return (
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 dark:border-white/10 dark:bg-black md:px-6">
      <div className="flex items-center gap-5">
        {/* On mobile the logo itself doubles as the "back to site" link, so
            View Site (below) is desktop-only there. md:pointer-events-none
            keeps the logo inert on desktop where the button still handles it. */}
        <a href="/" className="contents md:pointer-events-none md:cursor-default" aria-label="Back to Santy Stitches site">
          <img src={logo} alt="Santy Stitches" className="h-14 w-auto transition-all dark:invert" />
        </a>
        <span className="text-sm uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-xs uppercase tracking-widest text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white md:inline-block"
        >
          View site
        </a>
        <button
          type="button"
          onClick={onLogout}
          title="Log out"
          aria-label="Log out"
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-red-500/80 transition-colors hover:text-red-500 dark:text-red-400/80 dark:hover:text-red-400"
        >
          <span className="shrink-0">{logoutIcon}</span>
          Log out
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
          className="flex items-center justify-center text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          {isDark ? sunIcon : moonIcon}
        </button>
      </div>
    </header>
  );
}

export default AdminNavbar;
