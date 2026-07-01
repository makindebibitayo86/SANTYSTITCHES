import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, LogOut } from "lucide-react";
import logo from "../assets/santy-stitches-logo-transparent.png";

function AdminNavbar({ navItems, activeKey, onNavigate, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  function handleNavClick(key) {
    onNavigate?.(key);
    setIsOpen(false);
  }

  function handleLogoutClick() {
    setIsOpen(false);
    onLogout?.();
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/30 dark:bg-black/30 border-b border-black/10 dark:border-white/10 transition-colors">
      <div className="px-6 md:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0" title="Back to site">
            <img
              src={logo}
              alt="Santy Stitches"
              className="h-18 w-auto dark:invert transition-all"
            />
            <span className="hidden sm:block text-xs font-semibold uppercase tracking-[0.3em] text-black/70 dark:text-white/70">
              Admin
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                aria-current={item.key === activeKey ? "page" : undefined}
                className={`text-sm tracking-widest uppercase transition-colors ${
                  item.key === activeKey
                    ? "text-black dark:text-white"
                    : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side: view site + logout + theme toggle + mobile button */}
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="hidden md:block text-sm tracking-widest uppercase text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
            >
              View site
            </a>

            <button
              type="button"
              onClick={handleLogoutClick}
              className="hidden md:flex items-center gap-2 text-sm tracking-widest uppercase text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
            >
              <LogOut size={16} />
              Log out
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="text-black dark:text-white"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={22} /> : <Moon size={22} />}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="md:hidden text-black dark:text-white"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-black/10 dark:border-white/10 backdrop-blur-md bg-white/30 dark:bg-black/30 px-6 py-6 flex flex-col gap-6 transition-colors">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavClick(item.key)}
              aria-current={item.key === activeKey ? "page" : undefined}
              className={`text-left text-sm tracking-widest uppercase transition-colors ${
                item.key === activeKey
                  ? "text-black dark:text-white"
                  : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}

          <a
            href="/"
            className="text-left text-sm tracking-widest uppercase text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
          >
            View site
          </a>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="flex items-center gap-2 text-left text-sm tracking-widest uppercase text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}

export default AdminNavbar;
