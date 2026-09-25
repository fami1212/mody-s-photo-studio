import { supabase } from "@/integrations/supabase/client";
import { PHOTOS_BUCKET } from "@/lib/admin-storage";

async function loadBitmap(source: Blob): Promise<ImageBitmap> {
  return createImageBitmap(source, { imageOrientation: "from-image" } as ImageBitmapOptions);
}

async function resize(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible"))), "image/webp", quality),
  );
}

/** Creates thumb (600px) + display (1600px) WebP variants next to the original. */
export async function createVariants(source: Blob, originalPath: string) {
  const bitmap = await loadBitmap(source);
  const base = originalPath.replace(/\.[^.]+$/, "");
  const thumbPath = `${base}.thumb.webp`;
  const displayPath = `${base}.display.webp`;
  const [thumb, display] = await Promise.all([resize(bitmap, 600, 0.78), resize(bitmap, 1600, 0.82)]);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  const opts = { contentType: "image/webp", upsert: true, cacheControl: "31536000" };
  const [a, b] = await Promise.all([
    supabase.storage.from(PHOTOS_BUCKET).upload(thumbPath, thumb, opts),
    supabase.storage.from(PHOTOS_BUCKET).upload(displayPath, display, opts),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  return { thumb_path: thumbPath, display_path: displayPath, width, height };
}

/** Optimises photos uploaded before variants existed. */
export async function optimizeExisting(photos: { id: string; storage_path: string }[]) {
  let done = 0;
  for (const photo of photos) {
    const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).download(photo.storage_path);
    if (error || !data) continue;
    try {
      const variants = await createVariants(data, photo.storage_path);
      await supabase.from("photos").update(variants).eq("id", photo.id);
      done += 1;
    } catch {
      // skip unsupported formats
    }
  }
  return done;
}
