import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../config";

// Reads hit doGet — public, no key needed, same as fetchProducts in AdminPage.
async function fetchOrders() {
  const res = await fetch(`${API_URL}?action=getOrders`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Something went wrong");
  return data.orders || [];
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "—";
  return `₦${Number(price).toLocaleString()}`;
}

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  return Number.isNaN(d.getTime()) ? String(timestamp) : d.toLocaleString();
}

function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchOrders());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={load}
          className="border border-black/15 px-3 py-1.5 text-xs uppercase tracking-widest text-black/60 transition-colors hover:border-black hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white dark:hover:text-white"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <span>{error}</span>
          <button onClick={load} className="uppercase tracking-widest underline">
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="border border-black/10 dark:border-white/10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse border-b border-black/10 px-4 py-4 last:border-b-0 dark:border-white/10"
            >
              <div className="mb-2 h-3 w-1/3 bg-black/10 dark:bg-white/10" />
              <div className="h-2.5 w-1/5 bg-black/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-black/10 py-16 text-center text-sm text-black/40 dark:border-white/10 dark:text-white/40">
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto border border-black/10 dark:border-white/10">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                {["Date", "Product", "Customer", "Phone", "Size", "Price", "Note"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr
                  key={`${o.productId || "order"}-${o.timestamp || i}`}
                  className="border-b border-black/10 last:border-b-0 dark:border-white/10"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-black/60 dark:text-white/60">
                    {formatDate(o.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-['Playfair_Display'] text-black dark:text-white">
                    {o.productName || "—"}
                  </td>
                  <td className="px-4 py-3 text-black/80 dark:text-white/80">{o.name || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-black/60 dark:text-white/60">
                    {o.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">{o.size || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-['Playfair_Display'] text-black dark:text-white">
                    {formatPrice(o.price)}
                  </td>
                  <td
                    className="max-w-[220px] truncate px-4 py-3 text-black/50 dark:text-white/50"
                    title={o.note}
                  >
                    {o.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrdersManager;
