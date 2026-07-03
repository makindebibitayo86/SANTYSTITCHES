import { useState, useEffect, useCallback } from "react";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
// Same key hero/product writes already send as apiKey — Code.gs gates
// uploadAboutImage behind this too.
const API_KEY = import.meta.env.VITE_APPS_SCRIPT_API_KEY;

// About.jsx displays this at a 4:5 portrait ratio, same as the hero
// carousel's display resolution class — so the same quality/size budget
// as AdminHeroImages.jsx applies here (Code.gs ABOUT_TOTAL_CHAR_LIMIT
// matches HERO_TOTAL_CHAR_LIMIT: 49,000 chars * 10 chunk cells).
const MAX_DIMENSION_START = 1800;
const MIN_DIMENSION = 1200;
const ABOUT_CELL_CHAR_LIMIT = 49000; // matches Code.gs ABOUT_CELL_CHAR_LIMIT
const ABOUT_TOTAL_CHAR_LIMIT = ABOUT_CELL_CHAR_LIMIT * 10; // matches Code.gs ABOUT_CHUNK_COLUMNS.length

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
      if (dataUrl.length <= ABOUT_TOTAL_CHAR_LIMIT) {
        return { base64Data: dataUrl.split(",")[1], mimeType: "image/jpeg" };
      }
    }
  }

  throw new Error(
    "This image is too large/detailed to fit even at high quality — try a smaller source photo."
  );
}

// Plain-text body on purpose — no explicit Content-Type header, avoids a
// CORS preflight round-trip against the Apps Script backend.
async function postAction(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ apiKey: API_KEY, ...payload }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function AdminAbout() {
  const [image, setImage] = useState(null); // { imageUrl, updatedAt } | null
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadImage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getAboutImage`);
      const data = await res.json();
      setImage(data.image || null);
    } catch (err) {
      setError("Failed to load the current photo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  async function handleUpload(e) {
    const file = (e.target.files || [])[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const { base64Data, mimeType } = await compressImage(file);
      const result = await postAction({
        action: "uploadAboutImage",
        filename: file.name,
        mimeType,
        base64Data,
      });
      if (!result.ok) {
        setError(result.error || "Upload failed.");
      } else {
        await loadImage();
      }
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          About — Owner Photo
        </h2>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          Shown in the "The House" section of the site. Portrait orientation works best.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="aspect-[4/5] w-full max-w-[280px] shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
          {loading ? (
            <div className="h-full w-full animate-pulse bg-black/5 dark:bg-white/10" />
          ) : image?.imageUrl ? (
            <img src={image.imageUrl} alt="Owner" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-xs uppercase tracking-widest text-black/30 dark:text-white/30">
              No photo uploaded yet
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <label className="inline-block w-fit cursor-pointer border border-black px-4 py-2 text-sm uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black">
            {uploading ? "Uploading..." : image?.imageUrl ? "Replace photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          {image?.updatedAt && (
            <p className="text-xs text-black/40 dark:text-white/40">
              Last updated {new Date(image.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAbout;
