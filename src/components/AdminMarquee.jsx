import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { API_URL, ADMIN_TOKEN } from "../config";

/* ---------------------------------------------------------- */
/* API — reads hit doGet, writes hit doPost (apiKey-gated)     */
/* ---------------------------------------------------------- */

// listMarqueeMessages returns ALL messages (active + inactive) so hidden
// ones can still be managed here — getMarqueeMessages (used by the public
// site) only ever returns active ones. See Code.gs.
async function fetchMarqueeMessages() {
  const res = await fetch(`${API_URL}?action=listMarqueeMessages`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Something went wrong");
  return data.messages || [];
}

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

function isTrue(v) {
  return v === true || v === 1 || String(v).toUpperCase() === "TRUE";
}

/* ---------------------------------------------------------- */
/* Small shared bits — mirrors AdminPage.jsx's visual language */
/* ---------------------------------------------------------- */

function Pill({ children, tone = "neutral" }) {
  const tones = {
    good: "border-emerald-600/40 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-400",
    off: "border-black/15 text-black/35 dark:border-white/15 dark:text-white/35",
  };
  return (
    <span className={`inline-block border px-2 py-0.5 text-[0.62rem] uppercase tracking-widest ${tones[tone]}`}>
      {children}
    </span>
  );
}

function IconBtn({ onClick, title, children, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center border transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
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
  up: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  down: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  ),
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
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

const inputClass =
  "w-full border border-black/15 bg-transparent px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white";

/* ---------------------------------------------------------- */
/* Delete confirm                                               */
/* ---------------------------------------------------------- */

function ConfirmDeleteModal({ message, onCancel, onConfirm, deleting }) {
  if (!message) return null;
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
          <h3 className="mb-2 font-['Playfair_Display'] text-lg text-black dark:text-white">Delete message?</h3>
          <p className="mb-6 text-sm text-black/60 dark:text-white/60">
            "<span className="italic">{message.text}</span>" will be permanently removed. This can't be undone — if you just want it off the marquee, hide it instead.
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
/* Row                                                          */
/* ---------------------------------------------------------- */

function MessageRow({ message, index, count, onMove, onToggle, onEdit, onDelete, busy }) {
  const active = isTrue(message.active);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);

  useEffect(() => {
    if (!editing) setDraft(message.text);
  }, [message.text, editing]);

  function save() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.text) {
      setEditing(false);
      setDraft(message.text);
      return;
    }
    onEdit(message, trimmed);
    setEditing(false);
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 border-b border-black/10 px-4 py-3 last:border-b-0 dark:border-white/10 ${busy ? "opacity-50" : ""}`}>
      <div className="flex shrink-0 flex-col gap-1">
        <IconBtn title="Move up" onClick={() => onMove(message, -1)} disabled={index === 0 || busy}>{Icon.up}</IconBtn>
        <IconBtn title="Move down" onClick={() => onMove(message, 1)} disabled={index === count - 1 || busy}>{Icon.down}</IconBtn>
      </div>

      <div className="min-w-[200px] flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") { setEditing(false); setDraft(message.text); }
            }}
            onBlur={save}
            className={inputClass}
          />
        ) : (
          <p
            onClick={() => setEditing(true)}
            className="cursor-text font-['Playfair_Display'] text-sm text-black dark:text-white"
            title="Click to edit"
          >
            {message.text}
          </p>
        )}
      </div>

      <Pill tone={active ? "good" : "off"}>{active ? "Visible" : "Hidden"}</Pill>

      <div className="flex shrink-0 gap-2">
        <IconBtn title="Edit" onClick={() => setEditing(true)} disabled={busy}>{Icon.edit}</IconBtn>
        <IconBtn title={active ? "Hide" : "Unhide"} onClick={() => onToggle(message)} disabled={busy}>
          {active ? Icon.eyeOff : Icon.eye}
        </IconBtn>
        <IconBtn title="Delete" danger onClick={() => onDelete(message)} disabled={busy}>{Icon.trash}</IconBtn>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */

export default function AdminMarquee() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const messages = await fetchMarqueeMessages();
      setMessages(messages.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    setAdding(true);
    try {
      await callApi("addMarqueeMessage", { text, order: messages.length });
      setNewText("");
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleEdit(message, text) {
    setBusyId(message.id);
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, text } : m)));
    try {
      await callApi("updateMarqueeMessage", { id: message.id, text });
    } catch (err) {
      alert(err.message);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(message) {
    setBusyId(message.id);
    const nextActive = !isTrue(message.active);
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, active: nextActive } : m)));
    try {
      await callApi("toggleMarqueeMessageActive", { id: message.id, active: nextActive });
    } catch (err) {
      alert(err.message);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  // Swaps `message` with its neighbor in `direction` (-1 up, +1 down), then
  // persists the full new order — reorderMarqueeMessages_ sets sortOrder
  // from array position, so every row's index needs to be sent, not just
  // the two that moved.
  async function handleMove(message, direction) {
    const index = messages.findIndex((m) => m.id === message.id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= messages.length) return;

    const next = [...messages];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setMessages(next);
    setBusyId(message.id);
    try {
      await callApi("reorderMarqueeMessages", { order: next.map((m) => m.id) });
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
      await callApi("deleteMarqueeMessage", { id: deleteTarget.id });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-['Playfair_Display'] text-lg text-black dark:text-white">Marquee Messages</h1>
          <p className="mt-1 text-xs text-black/40 dark:text-white/40">
            Scrolling strip shown under the hero. Order top-to-bottom here matches left-to-right on the site.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          title="Refresh"
          className="flex h-10 w-10 items-center justify-center border border-black/15 text-black/60 hover:border-black hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white dark:hover:text-white"
        >
          {Icon.refresh}
        </button>
      </div>

      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap gap-3">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="New marquee message…"
          className={`${inputClass} min-w-[220px] flex-1`}
        />
        <button
          type="submit"
          disabled={adding || !newText.trim()}
          className="flex items-center gap-2 border border-black bg-black px-4 py-2.5 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
        >
          {Icon.plus} {adding ? "Adding…" : "Add"}
        </button>
      </form>

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <span>{error}</span>
          <button onClick={load} className="uppercase tracking-widest underline">Try again</button>
        </div>
      )}

      {loading ? (
        <div className="border border-black/10 py-16 text-center text-sm text-black/40 dark:border-white/10 dark:text-white/40">
          Loading…
        </div>
      ) : messages.length === 0 ? (
        <div className="border border-black/10 py-16 text-center text-sm text-black/40 dark:border-white/10 dark:text-white/40">
          No messages yet — add your first one above.
        </div>
      ) : (
        <div className="border border-black/10 dark:border-white/10">
          {messages.map((m, i) => (
            <MessageRow
              key={m.id}
              message={m}
              index={i}
              count={messages.length}
              onMove={handleMove}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              busy={busyId === m.id}
            />
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        message={deleteTarget}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
