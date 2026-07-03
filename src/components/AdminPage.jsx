import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { API_URL, ADMIN_SESSION_KEY, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_TOKEN } from "../config";
import logo from "../assets/santy-stitches-logo-transparent.png";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import AdminFooter from "./AdminFooter";
import AdminHeroImages from "./AdminHeroImages";
import AdminAbout from "./AdminAbout";
import OrdersManager from "./OrdersManager";

/* ---------------------------------------------------------- */
/* Constants — mirrors the shape used in Collections & Shop    */
/* ---------------------------------------------------------- */

// Must match CATEGORIES in Shop.jsx exactly, case-sensitive (see Code.gs header comment).
const CATEGORIES = ["Casual", "Corporate", "Streetwear", "Athleisure", "Caftan", "Accessories"];
// ⚠️ BACKEND DEPENDENCY: as of the last look at Code.gs, doPost coerces every save down to
// only "new" or "others" — anything else gets silently rewritten. Until that coercion logic
// is updated to accept the values below, picking anything but "new"/"others" here WILL cause
// exactly the admin-vs-sheet discrepancy this file was fixed to avoid. Update Code.gs first
// (or alongside this), then this comment can come out.
// Labels are the literal values as stored in the sheet — no invented display wording.
const TAG_OPTIONS = [
  { value: "new", label: "new" },
  { value: "bestseller", label: "bestseller" },
  { value: "limited", label: "limited" },
  { value: "sale", label: "sale" },
  { value: "restock", label: "restock" },
  { value: "others", label: "others" },
];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// Mirrors the Products sheet headers 1:1 (id / catalogNo / name / tag / category / meta /
// price / description / image / gallery / sizes / inStock / featured / sortOrder), plus
// `active` — a visibility flag the admin needs that Code.gs will be extended to store.
const EMPTY_PRODUCT = {
  id: "",
  catalogNo: "",
  name: "",
  tag: "others",
  category: CATEGORIES[0],
  meta: "",
  price: "",
  description: "",
  image: "",
  gallery: [],
  sizes: [],
  inStock: true,
  featured: false,
  sortOrder: 0,
  active: true,
};

// Google Sheets caps a cell at ~50,000 characters, and base64 inflates a file's byte size
// by ~33%. We keep a safety margin under that cap and shrink dimension + quality until the
// encoded string fits, rather than letting a save silently write a truncated/corrupt cell.
const MAX_CELL_CHARS = 45000;
const MAX_DIMENSION_START = 1200;
const MIN_DIMENSION = 400;

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file doesn't look like a valid image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

// Resizes/re-encodes an image file into a base64 JPEG small enough for a single sheet cell.
// Tries decreasing JPEG quality first at each dimension, then shrinks dimension and repeats.
// Returns null if even the smallest/lowest-quality attempt won't fit.
async function compressImageToBase64(file) {
  const img = await loadImageFromFile(file);

  for (let dimension = MAX_DIMENSION_START; dimension >= MIN_DIMENSION; dimension -= 200) {
    const scale = Math.min(1, dimension / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    for (let quality = 0.82; quality >= 0.35; quality -= 0.12) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_CELL_CHARS) return dataUrl;
    }
  }

  return null;
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "—";
  return `₦${Number(price).toLocaleString()}`;
}

function isTrue(v) {
  return v === true || v === 1 || String(v).toUpperCase() === "TRUE";
}

function tagLabel(tag) {
  // Show the raw stored value — never a made-up display label — so the admin
  // list always matches exactly what's sitting in the Google Sheet cell.
  return tag;
}

// Reads hit doGet — public, no key needed, plain query string.
async function fetchProducts({ tag, category } = {}) {
  const params = new URLSearchParams({ action: "list" });
  if (tag) params.set("tag", tag);
  if (category) params.set("category", category);
  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Something went wrong");
  return data.products || [];
}

// Writes hit doPost — gated by apiKey (Script Properties > API_KEY in Code.gs).
// No Content-Type header on purpose: that keeps this a "simple request" so the
// browser skips a CORS preflight OPTIONS call, which GAS web apps can't answer.
async function callApi(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action, apiKey: ADMIN_TOKEN, ...payload }),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

/* ---------------------------------------------------------- */
/* Login gate                                                  */
/* ---------------------------------------------------------- */

function LoginGate({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      onSuccess();
    } else {
      setError("Incorrect username or password");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-black/10 p-8 dark:border-white/10"
      >
        <img
          src={logo}
          alt="Santy Stitches"
          className="mx-auto mb-6 h-24 w-auto dark:invert transition-all"
        />
        <span className="mb-2 block text-[0.65rem] uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
          Admin Access
        </span>
        <h1 className="mb-6 font-['Playfair_Display'] text-2xl font-semibold text-black dark:text-white">
          Sign in to manage products
        </h1>

        <label className="mb-1.5 block text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
          Username
        </label>
        <input
          type="text"
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(""); }}
          className="mb-4 w-full border border-black/15 bg-transparent px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
        />

        <label className="mb-1.5 block text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          className="mb-1.5 w-full border border-black/15 bg-transparent px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
        />
        {error && <p className="mb-4 text-xs text-red-500">{error}</p>}
        {!error && <div className="mb-4" />}

        <button
          type="submit"
          disabled={!username || !password}
          className="w-full border border-black bg-black px-6 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
        >
          Enter
        </button>
      </form>
    </div>
  );
}

export function isAdminLoggedIn() {
  return typeof window !== "undefined" && sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

/* ---------------------------------------------------------- */
/* Small shared bits                                           */
/* ---------------------------------------------------------- */

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= breakpoint
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-black/20 text-black/60 dark:border-white/20 dark:text-white/60",
    good: "border-emerald-600/40 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-400",
    warn: "border-amber-600/40 text-amber-700 dark:border-amber-400/40 dark:text-amber-400",
    off: "border-black/15 text-black/35 dark:border-white/15 dark:text-white/35",
  };
  return (
    <span className={`inline-block border px-2 py-0.5 text-[0.62rem] uppercase tracking-widest ${tones[tone]}`}>
      {children}
    </span>
  );
}

function IconBtn({ onClick, title, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-8 w-8 items-center justify-center border transition-colors ${
        danger
          ? "border-black/15 text-black/50 hover:border-red-500 hover:text-red-500 dark:border-white/15 dark:text-white/50 dark:hover:border-red-400 dark:hover:text-red-400"
          : "border-black/15 text-black/60 hover:border-black hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

const Icon = {
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  grid: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  menu: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  upload: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  receipt: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 2z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  ),
  bag: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2l-3 6v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-3-6z" />
      <path d="M3 8h18" />
      <path d="M16 8a4 4 0 0 1-8 0" />
    </svg>
  ),
  user: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

// Sidebar sections — icons only on mobile, icon + label on desktop.
// Keys are used both as AdminShell's activeKey and as the section state
// AdminPage switches on, so keep them in sync if you add more.
const NAV_ITEMS = [
  { key: "hero", label: "Hero", icon: Icon.image },
  { key: "about", label: "About", icon: Icon.user },
  { key: "products", label: "Products", icon: Icon.grid, mobileIcon: Icon.bag },
  { key: "orders", label: "Orders", icon: Icon.receipt },
];

/* ---------------------------------------------------------- */
/* Product form (add / edit modal)                             */
/* ---------------------------------------------------------- */

function ChipToggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${
        active
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-black/15 text-black/60 hover:border-black/40 dark:border-white/15 dark:text-white/60 dark:hover:border-white/40"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
        {label} {hint && <span className="normal-case text-black/30 dark:text-white/30">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-black/15 bg-transparent px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white";

// Native <option> elements ignore bg-transparent — most browsers render the open
// dropdown panel with their own default (light) styling, so dark:text-white becomes
// invisible white-on-white. `color-scheme` tells the browser to draw the select's
// native chrome (including the option list) in dark mode instead — but on some
// browser/OS combos the popup listbox only honors color-scheme set at the document
// (<html>) level, not on the individual <select>, so this alone isn't reliable.
const selectClass = `${inputClass} dark:[color-scheme:dark]`;
// Belt-and-suspenders fallback: explicit (non-transparent) bg/text classes set
// directly on <option>, since browsers generally DO honor a solid background-color
// and color on options even when they ignore everything else about their styling.
// Apply this className to every <option> inside a `selectClass` <select>.
const optionClass = "bg-white text-black dark:bg-black dark:text-white";

// Shows the actual image (not a URL string), with an upload icon overlaid on it to
// replace the picture. Picking a file compresses it client-side and hands back a
// base64 data URL — that string is exactly what gets written into the sheet cell.
function ImagePicker({ label, hint, value, onChange, size = "h-32 w-32" }) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires onChange
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const base64 = await compressImageToBase64(file);
      if (!base64) {
        setError("Couldn't compress this image small enough for a sheet cell — try a smaller or simpler photo.");
        return;
      }
      onChange(base64);
    } catch (err) {
      setError(err.message || "Couldn't process that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-start gap-3">
        <div className={`relative ${size} shrink-0 overflow-hidden border border-black/10 dark:border-white/10`}>
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-black/20 dark:text-white/20">
              {Icon.image}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={value ? "Replace image" : "Upload image"}
            aria-label={value ? "Replace image" : "Upload image"}
            className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center border border-black/20 bg-white/90 text-black backdrop-blur-sm transition-colors hover:bg-white dark:border-white/20 dark:bg-black/90 dark:text-white dark:hover:bg-black"
          >
            {busy ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              Icon.upload
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <p className="flex-1 text-xs text-black/40 dark:text-white/40">
          {busy
            ? "Compressing…"
            : value
            ? "Click the upload icon to replace this image."
            : "Click the upload icon to choose a photo — it's compressed and saved directly, no URL needed."}
          {error && <span className="mt-1 block text-red-500 dark:text-red-400">{error}</span>}
        </p>
      </div>
    </Field>
  );
}

function ProductForm({ product, onCancel, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_PRODUCT,
    ...product,
    gallery: product?.gallery?.length ? product.gallery : [],
    sizes: product?.sizes?.length ? product.sizes : [],
  }));

  const isEdit = Boolean(product?.id);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleInArray(key, value) {
    setForm((f) => {
      const arr = f[key] || [];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.image.trim() || form.price === "") return;
    onSave({
      ...form,
      id: form.id || generateId(),
      price: Number(form.price),
      sortOrder: form.sortOrder === "" ? 0 : Number(form.sortOrder),
      gallery: form.gallery.filter(Boolean),
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm md:items-center md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden border border-black/10 bg-white dark:border-white/10 dark:bg-black"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
            <h3 className="font-['Playfair_Display'] text-xl text-black dark:text-white">
              {isEdit ? "Edit product" : "Add product"}
            </h3>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
            >
              {Icon.close}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Name" hint="*">
                <input required className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Alpha Bomber Jacket" />
              </Field>
              <Field label="Price (₦)" hint="*">
                <input required type="number" min="0" className={inputClass} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 45000" />
              </Field>

              <Field label="Category">
                <select className={selectClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c} className={optionClass}>{c}</option>)}
                </select>
              </Field>
              <Field label="Listing" hint="which tab it shows in">
                <select className={selectClass} value={form.tag} onChange={(e) => set("tag", e.target.value)}>
                  {TAG_OPTIONS.map((t) => <option key={t.value} value={t.value} className={optionClass}>{t.label}</option>)}
                </select>
              </Field>

              <Field label="Catalog No." hint="(optional)">
                <input className={inputClass} value={form.catalogNo} onChange={(e) => set("catalogNo", e.target.value)} placeholder="e.g. SS-014" />
              </Field>
              <Field label="Meta" hint="e.g. material / fit">
                <input className={inputClass} value={form.meta} onChange={(e) => set("meta", e.target.value)} placeholder="e.g. Cotton / Unisex" />
              </Field>
            </div>

            <Field label="Description" hint="(optional)">
              <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="A short description shown in the order modal…" />
            </Field>

            <ImagePicker
              label="Main image"
              hint="*"
              value={form.image}
              onChange={(base64) => set("image", base64)}
              size="h-56 w-56"
            />

            <Field label="Sizes offered" hint="(leave empty to use the default XS–XXL range)">
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((s) => (
                  <ChipToggle key={s} active={form.sizes.includes(s)} onClick={() => toggleInArray("sizes", s)}>
                    {s}
                  </ChipToggle>
                ))}
              </div>
            </Field>

            <Field label="Sort order" hint="lower shows first, leave 0 for default">
              <input type="number" className={inputClass} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} placeholder="0" />
            </Field>

            <div className="flex flex-wrap gap-6 border-t border-black/10 pt-5 dark:border-white/10">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-black dark:text-white">
                <input type="checkbox" checked={form.inStock} onChange={(e) => set("inStock", e.target.checked)} className="h-4 w-4 accent-black dark:accent-white" />
                In stock
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-black dark:text-white">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-black dark:accent-white" />
                Featured on shop homepage
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-black dark:text-white">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-black dark:accent-white" />
                Visible on site
              </label>
            </div>
          </form>

          <div className="flex justify-end gap-3 border-t border-black/10 px-6 py-4 dark:border-white/10">
            <button
              type="button"
              onClick={onCancel}
              className="border border-black/15 px-5 py-2.5 text-sm uppercase tracking-widest text-black/60 transition-colors hover:border-black/40 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="border border-black bg-black px-6 py-2.5 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------- */
/* Skeleton                                                     */
/* ---------------------------------------------------------- */

function TableSkeleton({ rows = 6 }) {
  const pulse = "animate-pulse bg-black/10 dark:bg-white/10";
  return (
    <div className="border border-black/10 dark:border-white/10">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-black/10 px-4 py-3 last:border-b-0 dark:border-white/10">
          <div className={`h-12 w-12 shrink-0 ${pulse}`} />
          <div className="flex-1">
            <div className={`mb-2 h-3 w-1/3 ${pulse}`} />
            <div className={`h-2.5 w-1/5 ${pulse}`} />
          </div>
          <div className={`h-3 w-16 ${pulse}`} />
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Product row (desktop table + mobile card, same component)  */
/* ---------------------------------------------------------- */

function ProductRow({ product, isMobile, onEdit, onToggle, onDelete, busy }) {
  const active = isTrue(product.active);
  const inStock = isTrue(product.inStock);

  if (isMobile) {
    return (
      <div
        onClick={() => onEdit(product)}
        className="flex cursor-pointer gap-3 border-b border-black/10 px-4 py-4 transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03]"
      >
        <img src={product.image} alt="" className="h-16 w-16 shrink-0 border border-black/10 object-cover dark:border-white/10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-['Playfair_Display'] text-sm text-black dark:text-white">{product.name}</p>
              <p className="text-xs text-black/40 dark:text-white/40">{product.category}</p>
            </div>
            <span className="shrink-0 font-['Playfair_Display'] text-sm text-black dark:text-white">{formatPrice(product.price)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Pill tone={active ? "good" : "off"}>{active ? "Visible" : "Hidden"}</Pill>
            {!inStock && <Pill tone="warn">Sold out</Pill>}
            {product.tag && product.tag !== "others" && <Pill>{tagLabel(product.tag)}</Pill>}
          </div>
          <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <IconBtn title="Edit" onClick={() => onEdit(product)}>{Icon.edit}</IconBtn>
            <IconBtn title={active ? "Hide" : "Unhide"} onClick={() => onToggle(product)}>{active ? Icon.eyeOff : Icon.eye}</IconBtn>
            <IconBtn title="Delete" danger onClick={() => onDelete(product)}>{Icon.trash}</IconBtn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr
      onClick={() => onEdit(product)}
      className={`cursor-pointer border-b border-black/10 transition-colors last:border-b-0 hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03] ${busy ? "opacity-50" : ""}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={product.image} alt="" className="h-11 w-11 shrink-0 border border-black/10 object-cover dark:border-white/10" />
          <div className="min-w-0">
            <p className="truncate font-['Playfair_Display'] text-sm text-black dark:text-white">{product.name}</p>
            {product.catalogNo && <p className="text-[0.7rem] text-black/40 dark:text-white/40">{product.catalogNo}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-black/70 dark:text-white/70">{product.category}</td>
      <td className="px-4 py-3 font-['Playfair_Display'] text-sm text-black dark:text-white">{formatPrice(product.price)}</td>
      <td className="px-4 py-3">{product.tag && product.tag !== "others" ? <Pill>{tagLabel(product.tag)}</Pill> : <span className="text-black/25 dark:text-white/25">—</span>}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          <Pill tone={active ? "good" : "off"}>{active ? "Visible" : "Hidden"}</Pill>
          {!inStock && <Pill tone="warn">Sold out</Pill>}
        </div>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end gap-2">
          <IconBtn title="Edit" onClick={() => onEdit(product)}>{Icon.edit}</IconBtn>
          <IconBtn title={active ? "Hide" : "Unhide"} onClick={() => onToggle(product)}>{active ? Icon.eyeOff : Icon.eye}</IconBtn>
          <IconBtn title="Delete" danger onClick={() => onDelete(product)}>{Icon.trash}</IconBtn>
        </div>
      </td>
    </tr>
  );
}

/* ---------------------------------------------------------- */
/* Delete confirm                                               */
/* ---------------------------------------------------------- */

function ConfirmDeleteModal({ product, onCancel, onConfirm, deleting }) {
  if (!product) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="w-full max-w-sm border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-2 font-['Playfair_Display'] text-lg text-black dark:text-white">Delete product?</h3>
          <p className="mb-6 text-sm text-black/60 dark:text-white/60">
            <strong>{product.name}</strong> will be permanently removed. This can't be undone — if you just want it off the site, hide it instead.
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="border border-black/15 px-4 py-2 text-sm uppercase tracking-widest text-black/60 hover:border-black/40 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white">
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="border border-red-600 bg-red-600 px-4 py-2 text-sm uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------- */
/* Admin navbar — sticky glass bar, same language as site Navbar */
/* ---------------------------------------------------------- */

function AdminShell({ title, activeKey, actions, onNavigate, onLogout, children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white transition-colors dark:bg-black">
      <AdminNavbar onLogout={onLogout} />

      <div className="flex">
        <AdminSidebar navItems={NAV_ITEMS} activeKey={activeKey} onNavigate={onNavigate} />

        <div className="flex min-h-[calc(100vh-5rem)] min-w-0 flex-1 flex-col">
          {/* Actions bar — skipped entirely when a section supplies neither a
              title nor actions, so pages like Hero (which has its own inline
              header) don't get an empty bordered strip above their content. */}
          {(title || actions) && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-6 py-4 dark:border-white/10 md:px-10">
              {title && (
                <h1 className="font-['Playfair_Display'] text-lg text-black dark:text-white">
                  {title}
                </h1>
              )}
              <div className="flex flex-wrap gap-2">{actions}</div>
            </div>
          )}

          <main className="mx-auto w-full max-w-[1300px] flex-1 px-6 py-8 md:px-10">{children}</main>

          <AdminFooter />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main catalogue manager                                       */
/* ---------------------------------------------------------- */

function CatalogueManager({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null closed, {} new, obj = edit
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // All / Visible / Hidden
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const products = await fetchProducts();
      setProducts(products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (statusFilter === "Visible" && !isTrue(p.active)) return false;
      if (statusFilter === "Hidden" && isTrue(p.active)) return false;
      if (search.trim() && !String(p.name).toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [products, categoryFilter, statusFilter, search]);

  // Any change to what's being filtered should snap back to page 1 — otherwise
  // e.g. narrowing a search while sitting on page 4 can strand the view on a
  // page that no longer has any rows.
  useEffect(() => { setPage(1); }, [search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp if the current page is now out of range (e.g. after a delete shrinks
  // the list, or products reload with fewer results than before).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  async function handleSave(product) {
    setSaving(true);
    try {
      const isEdit = editing && editing.id;
      if (isEdit) {
        await callApi("update", { id: product.id, product });
      } else {
        await callApi("create", { product });
      }
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(product) {
    setBusyId(product.id);
    const nextActive = !isTrue(product.active);
    // optimistic update
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: nextActive } : p)));
    try {
      await callApi("update", { id: product.id, product: { active: nextActive } });
    } catch (err) {
      alert(err.message);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await callApi("delete", { id: deleteTarget.id });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell
      title="Product Catalogue"
      activeKey="products"
      onNavigate={onNavigate}
      onLogout={() => { sessionStorage.removeItem(ADMIN_SESSION_KEY); window.location.reload(); }}
      actions={
        <>
          <button
            type="button"
            onClick={load}
            title="Refresh"
            className="flex h-10 w-10 items-center justify-center border border-black/15 text-black/60 hover:border-black hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white dark:hover:text-white"
          >
            {Icon.refresh}
          </button>
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY_PRODUCT })}
            className="flex items-center gap-2 border border-black bg-black px-4 py-2.5 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
          >
            {Icon.plus} Add product
          </button>
        </>
      }
    >
        {/* Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="border border-black/10 p-4 dark:border-white/10">
            <p className="text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">Total</p>
            <p className="mt-1 font-['Playfair_Display'] text-2xl text-black dark:text-white">{products.length}</p>
          </div>
          <div className="border border-black/10 p-4 dark:border-white/10">
            <p className="text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">Visible</p>
            <p className="mt-1 font-['Playfair_Display'] text-2xl text-black dark:text-white">{products.filter((p) => isTrue(p.active)).length}</p>
          </div>
          <div className="border border-black/10 p-4 dark:border-white/10">
            <p className="text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">Hidden</p>
            <p className="mt-1 font-['Playfair_Display'] text-2xl text-black dark:text-white">{products.filter((p) => !isTrue(p.active)).length}</p>
          </div>
          <div className="border border-black/10 p-4 dark:border-white/10">
            <p className="text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">Sold out</p>
            <p className="mt-1 font-['Playfair_Display'] text-2xl text-black dark:text-white">{products.filter((p) => !isTrue(p.inStock)).length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[180px] flex-1 border border-black/15 bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-black/15 bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white dark:[color-scheme:dark]">
            <option value="All" className={optionClass}>All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c} className={optionClass}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-black/15 bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white dark:[color-scheme:dark]">
            <option value="All" className={optionClass}>All statuses</option>
            <option value="Visible" className={optionClass}>Visible only</option>
            <option value="Hidden" className={optionClass}>Hidden only</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <span>{error}</span>
            <button onClick={load} className="uppercase tracking-widest underline">Try again</button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <TableSkeleton rows={isMobile ? 4 : 6} />
        ) : filtered.length === 0 ? (
          <div className="border border-black/10 py-16 text-center text-sm text-black/40 dark:border-white/10 dark:text-white/40">
            {products.length === 0 ? "No products yet — add your first one." : "No products match these filters."}
          </div>
        ) : isMobile ? (
          <div className="border border-black/10 dark:border-white/10">
            {paginated.map((p) => (
              <ProductRow key={p.id} product={p} isMobile onEdit={setEditing} onToggle={handleToggle} onDelete={setDeleteTarget} busy={busyId === p.id} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-black/10 dark:border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10">
                  {["Product", "Category", "Price", "Tag", "Status", ""].map((h) => (
                    <th key={h} className={`px-4 py-3 text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40 ${h === "" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <ProductRow key={p.id} product={p} isMobile={false} onEdit={setEditing} onToggle={handleToggle} onDelete={setDeleteTarget} busy={busyId === p.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-black/40 dark:text-white/40">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border border-black/15 px-3 py-1.5 text-xs uppercase tracking-widest text-black/70 transition-colors hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/15 dark:border-white/15 dark:text-white/70 dark:hover:border-white dark:hover:text-white"
              >
                Prev
              </button>
              <span className="text-xs text-black/50 dark:text-white/50">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border border-black/15 px-3 py-1.5 text-xs uppercase tracking-widest text-black/70 transition-colors hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/15 dark:border-white/15 dark:text-white/70 dark:hover:border-white dark:hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}

      {editing && (
        <ProductForm
          product={editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      <ConfirmDeleteModal
        product={deleteTarget}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
}

/* ---------------------------------------------------------- */
/* Page entry — gate then manager                               */
/* ---------------------------------------------------------- */

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(isAdminLoggedIn());
  // Which sidebar section is active. Hero is the default landing view.
  const [section, setSection] = useState("hero");

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "ADMIN - SANTY STITCHES";
    return () => { document.title = prevTitle; };
  }, []);

  if (!loggedIn) return <LoginGate onSuccess={() => setLoggedIn(true)} />;

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.reload();
  };

  if (section === "hero") {
    return (
      <AdminShell activeKey="hero" onNavigate={setSection} onLogout={handleLogout}>
        <AdminHeroImages />
      </AdminShell>
    );
  }

  if (section === "about") {
    return (
      <AdminShell activeKey="about" onNavigate={setSection} onLogout={handleLogout}>
        <AdminAbout />
      </AdminShell>
    );
  }

  if (section === "orders") {
    return (
      <AdminShell title="Orders" activeKey="orders" onNavigate={setSection} onLogout={handleLogout}>
        <OrdersManager />
      </AdminShell>
    );
  }

  return <CatalogueManager onNavigate={setSection} />;
}
