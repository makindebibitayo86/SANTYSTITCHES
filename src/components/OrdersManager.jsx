import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { API_URL } from "../config";
import logo from "../assets/santy-stitches-logo-transparent.png";

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

// Cart checkouts store their line items as a JSON string in itemsJson (see
// writeOrderRow_ in Code.gs). Legacy single-item "enquire" orders never had
// that column — they just have productName/size/price directly on the row.
// This normalizes both shapes into one array so the UI only has one case to
// render.
function getOrderItems(o) {
  if (o.itemsJson) {
    try {
      const parsed = JSON.parse(o.itemsJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through to legacy shape below
    }
  }
  if (o.productName) {
    return [{ name: o.productName, size: o.size, price: o.price, quantity: 1 }];
  }
  return [];
}

// Paystack cart checkouts carry a confirmed `amount` (naira) written by
// verifyPaystackPayment/createPendingOrder in Code.gs. Legacy enquiry rows
// never had that column — they just have `price` for the single item.
function getOrderTotal(o) {
  if (o.amount !== undefined && o.amount !== null && o.amount !== "") return Number(o.amount);
  if (o.price !== undefined && o.price !== null && o.price !== "") return Number(o.price);
  return null;
}

// Legacy rows (written by handleCreateOrder_, before Paystack checkout
// existed) never had a `status` column at all — those were just enquiries,
// not a payment Code.gs ever tracked, so there's nothing to "pending" here.
function getOrderStatus(o) {
  return o.status || "enquiry";
}

const STATUS_STYLES = {
  paid: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  amount_mismatch: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  abandoned: "border-black/15 bg-black/5 text-black/50 dark:border-white/15 dark:bg-white/5 dark:text-white/50",
  enquiry: "border-black/15 bg-black/5 text-black/50 dark:border-white/15 dark:bg-white/5 dark:text-white/50",
};

const STATUS_LABELS = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  amount_mismatch: "Amount mismatch",
  abandoned: "Abandoned",
  enquiry: "Enquiry",
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.enquiry;
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-block whitespace-nowrap border px-2 py-1 text-[0.65rem] uppercase tracking-widest ${style}`}>
      {label}
    </span>
  );
}

// Builds a scalloped/toothed circle clip-path — the classic postmark-style
// stamp edge — by alternating between an outer and inner radius around the
// circle. Computed once at module load since it never depends on status.
function buildJaggedCircleClipPath(teeth = 24, outerR = 50, innerR = 43) {
  const points = [];
  const step = Math.PI / teeth;
  for (let i = 0; i < teeth * 2; i++) {
    const angle = i * step;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  return `polygon(${points.join(", ")})`;
}

const STAMP_CLIP_PATH = buildJaggedCircleClipPath();

const STAMP_ACCENT = {
  paid: "bg-green-600 border-green-600",
  pending: "bg-amber-500 border-amber-500",
  failed: "bg-red-600 border-red-600",
  amount_mismatch: "bg-orange-500 border-orange-500",
  abandoned: "bg-neutral-400 border-neutral-400",
  enquiry: "bg-neutral-400 border-neutral-400",
};

function StatusStamp({ status }) {
  const [circleClass, borderClass] = (STAMP_ACCENT[status] || STAMP_ACCENT.enquiry).split(" ");
  const label = STATUS_LABELS[status] || status;
  return (
    <span className="relative inline-flex h-20 w-20 shrink-0 items-center justify-center">
      {/* jagged circle backdrop */}
      <span className={`absolute inset-0 opacity-90 ${circleClass}`} style={{ clipPath: STAMP_CLIP_PATH }} />
      {/* straight, unrotated text bar overlapping the circle */}
      <span
        className={`relative z-10 w-[135%] border-2 bg-white px-2 py-1.5 text-center text-[0.6rem] font-black uppercase tracking-wide text-black dark:bg-black dark:text-white ${borderClass}`}
      >
        {label}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------- */
/* Order detail modal                                          */
/* ---------------------------------------------------------- */

function OrderDetailModal({ order, onClose }) {
  useEffect(() => {
    if (!order) return undefined;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [order]);

  if (!order) return null;

  const items = getOrderItems(order);
  const total = getOrderTotal(order);
  const status = getOrderStatus(order);
  const contact = [order.phone, order.email].filter(Boolean);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdrop}
      >
        <motion.div
          className="no-scrollbar relative max-h-[90vh] w-full max-w-md overflow-y-auto border-2 border-black bg-white p-6 shadow-2xl dark:border-white dark:bg-black md:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
          >
            ✕
          </button>

          <img
            src={logo}
            alt="Santy Stitches"
            className="mb-4 h-16 w-auto dark:invert transition-all"
          />

          <span className="mb-1 block text-[0.65rem] uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
            {formatDate(order.timestamp)}
          </span>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="font-['Playfair_Display'] text-xl font-semibold text-black dark:text-white">
              Order detail
            </h3>
            <StatusStamp status={status} />
          </div>

          <div className="mb-6 flex flex-col gap-4 text-sm">
            <div>
              <p className="mb-1 text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">Buyer</p>
              <p className="text-black dark:text-white">{order.name || "—"}</p>
            </div>

            <div>
              <p className="mb-1 text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">Contact</p>
              {contact.length > 0 ? (
                <div className="flex flex-col gap-0.5 text-black/80 dark:text-white/80">
                  {contact.map((c) => <span key={c}>{c}</span>)}
                </div>
              ) : (
                <p className="text-black/40 dark:text-white/40">—</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">
                Items
              </p>
              {items.length > 0 ? (
                <div className="border border-black/10 dark:border-white/10">
                  {items.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 border-b border-black/10 px-3 py-2.5 last:border-b-0 dark:border-white/10"
                    >
                      <div>
                        <p className="text-black dark:text-white">{it.name || "—"}</p>
                        <p className="text-xs text-black/40 dark:text-white/40">
                          {it.size ? `Size ${it.size}` : "No size specified"}
                          {Number(it.quantity) > 1 ? ` · Qty ${it.quantity}` : ""}
                        </p>
                      </div>
                      <p className="whitespace-nowrap font-['Playfair_Display'] text-black dark:text-white">
                        {formatPrice(it.price)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black/40 dark:text-white/40">—</p>
              )}
            </div>

            {order.note && (
              <div>
                <p className="mb-1 text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">
                  Note
                </p>
                <p className="text-black/70 dark:text-white/70">{order.note}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
            <p className="text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">Total</p>
            <p className="font-['Playfair_Display'] text-xl text-black dark:text-white">{formatPrice(total)}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------- */
/* Orders list                                                  */
/* ---------------------------------------------------------- */

const PAGE_SIZE = 10;

function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchOrders());
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const paginated = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <div className="no-scrollbar overflow-x-auto border border-black/10 dark:border-white/10">
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                {["Date", "Product", "Customer", "Phone", "Size", "Price", "Status"].map((h) => (
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
              {paginated.map((o, i) => (
                <tr
                  key={`${o.productId || "order"}-${o.timestamp || i}`}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer border-b border-black/10 transition-colors last:border-b-0 hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03]"
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
                    {formatPrice(getOrderTotal(o))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={getOrderStatus(o)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && orders.length > PAGE_SIZE && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-black/40 dark:text-white/40">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, orders.length)} of {orders.length}
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

      <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default OrdersManager;
