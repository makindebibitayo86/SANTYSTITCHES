import { useState, useEffect, useCallback } from "react";

import { API_URL, ADMIN_TOKEN } from "../config";

// Code.gs now chunks each image's base64 across up to 10 Sheet cells
// (imageData..imageData10, ~49,000 chars each) instead of squeezing
// everything into one, so the budget here is far bigger than a single
// cell — see HERO_TOTAL_CHAR_LIMIT below (keep this in sync with
// HERO_CELL_CHAR_LIMIT * HERO_CHUNK_COLUMNS.length in Code.gs).
//
// Quality target: 1800px is comfortably above anything the hero carousel
// ever displays it at (see Hero.jsx), so there's no visual benefit to
// storing more resolution than that — it would just waste the budget.
// Within that resolution, quality starts near-max (0.92) and only steps
// down a little at a time, so almost every real photo lands with no
// perceptible loss. The floor (1200px / 0.75) only kicks in for
// unusually large or detail-heavy source files, and even that is far
// above the old 400px/0.35 floor that caused the original blur.
const MAX_DIMENSION_START = 1800;
const MIN_DIMENSION = 1200;
const HERO_CELL_CHAR_LIMIT = 49000; // matches Code.gs HERO_CELL_CHAR_LIMIT
const HERO_TOTAL_CHAR_LIMIT = HERO_CELL_CHAR_LIMIT * 10; // matches Code.gs HERO_CHUNK_COLUMNS.length

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file) {
  const img = await loadImageFromFile(file);

  // Never upscale — if the source is already smaller than our target,
  // keep its native size rather than stretching it (stretching would be
  // a quality loss in itself).
  const startDimension = Math.min(MAX_DIMENSION_START, Math.max(img.width, img.height));

  for (let dimension = startDimension; dimension >= MIN_DIMENSION; dimension -= 200) {
    const scale = Math.min(1, dimension / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);

    for (let quality = 0.92; quality >= 0.75; quality -= 0.05) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= HERO_TOTAL_CHAR_LIMIT) {
        return { base64Data: dataUrl.split(",")[1], mimeType: "image/jpeg" };
      }
    }
  }

  // Even 1200px at quality 0.75 didn't fit — an unusually large/detailed
  // photo. Rather than silently keep dropping quality further (which is
  // where the old blur bug came from), fail loudly so the admin knows to
  // pick a smaller source photo instead of us guessing on their behalf.
  throw new Error(
    "This image is too large/detailed to fit even at high quality — try a smaller source photo."
  );
}

// Plain-text body on purpose — no explicit Content-Type header, avoids the
// CORS preflight issue hit on DON ELCLASICO's Apps Script backend.
async function postAction(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ apiKey: ADMIN_TOKEN, ...payload }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function AdminHeroImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}?action=getHeroImages`);
      const data = await res.json();
      const sorted = (data.images || []).sort((a, b) => a.order - b.order);
      setImages(sorted);
    } catch (err) {
      setError("Failed to load hero images.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    let hadFailure = false;
    try {
      for (const file of files) {
        const { base64Data, mimeType } = await compressImage(file);
        const result = await postAction({
          action: "uploadHeroImage",
          filename: file.name,
          mimeType,
          base64Data,
          order: images.length,
        });
        if (!result.ok) {
          hadFailure = true;
          setError(result.error || "One or more images failed to upload.");
        }
      }
      if (!hadFailure) await loadImages();
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this hero image?")) return;
    setImages((prev) => prev.filter((img) => img.id !== id));
    try {
      await postAction({ action: "deleteHeroImage", id });
    } catch (err) {
      setError("Delete failed — reloading to resync.");
      await loadImages();
    }
  }

  async function handleToggleActive(id, active) {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, active } : img))
    );
    try {
      await postAction({ action: "toggleHeroImageActive", id, active });
    } catch (err) {
      setError("Failed to update — reloading to resync.");
      await loadImages();
    }
  }

  function moveImage(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;

    const reordered = [...images];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setImages(reordered);

    postAction({
      action: "reorderHeroImages",
      order: reordered.map((img) => img.id),
    }).catch(async () => {
      setError("Reorder failed — reloading to resync.");
      await loadImages();
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Hero Images
        </h2>
        <label className="cursor-pointer text-sm tracking-wide uppercase border border-black dark:border-white px-4 py-2 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
          {uploading ? "Uploading..." : "Add Images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded bg-black/5 dark:bg-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          No hero images yet. Add some to populate the homepage carousel.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative rounded overflow-hidden border border-black/10 dark:border-white/10"
            >
              <img
                src={img.imageUrl}
                alt=""
                className={`w-full aspect-[4/5] object-cover ${
                  img.active ? "" : "opacity-30"
                }`}
              />

              <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm p-2 flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    className="text-white text-xs px-1.5 py-0.5 disabled:opacity-30"
                    aria-label="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === images.length - 1}
                    className="text-white text-xs px-1.5 py-0.5 disabled:opacity-30"
                    aria-label="Move later"
                  >
                    ↓
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(img.id, !img.active)}
                  className="text-white text-xs px-1.5 py-0.5"
                >
                  {img.active ? "Hide" : "Show"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="text-red-400 text-xs px-1.5 py-0.5"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminHeroImages;
