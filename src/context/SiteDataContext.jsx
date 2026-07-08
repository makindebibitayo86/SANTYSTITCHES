import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { API_URL } from "../config";

/**
 * SiteDataContext
 * ----------------
 * Fires ONE request to the Apps Script "bootstrap" action on mount and
 * shares the result (products, hero images, about image, marquee messages)
 * with every component that needs it — instead of Hero, About, HeroMarquee,
 * Collections, and Shop each independently fetching their own slice.
 *
 * Trade-off, on purpose: since everything comes back in a single response,
 * every section waits for the SAME fetch to resolve, including the heaviest
 * piece (hero images, which carry base64 image data). That means sections
 * appear together rather than staggering in as each one's own fetch happens
 * to finish — a deliberate choice over the previous "whoever's fetch
 * resolves first shows first" behavior. Each consuming component still
 * renders its own skeleton/loading state while `status === "loading"`, so
 * the page isn't a blank freeze in the meantime.
 *
 * Only wraps the public-facing site (see App.jsx) — the admin panel reads
 * live, uncached data directly (e.g. listMarqueeMessages, getOrders) since
 * admins need to see the true current state, not a shared cached snapshot.
 */

const SiteDataContext = createContext(null);

const EMPTY_DATA = {
  products: [],
  heroImages: [],
  aboutImage: null,
  marqueeMessages: [],
};

export function SiteDataProvider({ children }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [status, setStatus] = useState("loading"); // "loading" | "loaded" | "error"
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      setStatus("loading");
      try {
        const res = await fetch(`${API_URL}?action=bootstrap`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Failed to load site data");
        if (cancelled) return;

        setData({
          products: json.products || [],
          heroImages: json.heroImages || [],
          aboutImage: json.aboutImage || null,
          marqueeMessages: json.marqueeMessages || [],
        });
        setStatus("loaded");
      } catch (err) {
        console.error("Failed to load site bootstrap data:", err);
        if (!cancelled) setStatus("error");
      }
    }

    loadBootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Exposed so a "Try again" button (Collections/Shop error states) can
  // re-run the whole bootstrap fetch rather than each section retrying its
  // own slice independently.
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <SiteDataContext.Provider value={{ ...data, status, refetch }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) {
    throw new Error("useSiteData must be used within a SiteDataProvider");
  }
  return ctx;
}
