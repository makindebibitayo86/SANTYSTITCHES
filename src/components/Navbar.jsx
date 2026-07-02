import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, ShoppingBag } from "lucide-react";
import logo from "../assets/santy-stitches-logo-transparent.png";
import { useCart } from "../context/CartContext";
import CartDrawer from "./CartDrawer";

const NAV_LINKS = [
  { label: "Collections", href: "#collections" },
  { label: "Shop", href: "#shop" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { cartCount, openCart } = useCart();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const id = href.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;

    const navbarHeight = 80; // matches h-20
    const top = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

    window.scrollTo({ top, behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/30 dark:bg-black/30 border-b border-black/10 dark:border-white/10 transition-colors">
      <div className="px-6 md:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 shrink-0">
            <img
              src={logo}
              alt="Santy Stitches"
              className="h-18 w-auto dark:invert transition-all"
            />
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm tracking-widest uppercase text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side: cart + theme toggle + mobile button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openCart}
              className="relative text-black dark:text-white"
              aria-label="Open cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[0.6rem] font-medium leading-none text-white dark:bg-white dark:text-black">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
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
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm tracking-widest uppercase text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <CartDrawer />
    </nav>
  );
}

export default Navbar;
