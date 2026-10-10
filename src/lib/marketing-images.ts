import { supabase } from "@/integrations/supabase/client";

export function shootingDescription(title: string, category?: string | null, body?: string | null) {
  return body?.replace(/\s+/g, " ").trim().slice(0, 160) || `Découvrez « ${title} », un shooting ${category ? category.toLowerCase() : "photo"} signé Mody Photography à Casablanca.`;
}

export async function uploadMarketingImage(source: Blob, kind: "hero" | "share") {
  const bitmap = await createImageBitmap(source);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = kind === "share" ? 1200 : 1600;
    canvas.height = kind === "share" ? 630 : Math.round(bitmap.height * Math.min(1, 1600 / bitmap.width));
    if (kind === "hero") canvas.width = Math.min(bitmap.width, 1600);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Conversion impossible");
    const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
    ctx.drawImage(bitmap, (canvas.width - bitmap.width * scale) / 2, (canvas.height - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Conversion impossible")), "image/jpeg", 0.82));
    const path = `marketing/${crypto.randomUUID()}-${kind}.jpg`;
    const { error } = await supabase.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return path;
  } finally { bitmap.close(); }
}

export async function prepareShootingSeo(post: { id: string; slug: string; title: string; category: string | null; body: string | null; cover_photo_id: string | null; status: string }) {
  let imagePath: string | null = null;
  let photoId = post.cover_photo_id;
  if (!photoId) {
    const { data, error } = await supabase.from("post_photos").select("photo_id").eq("post_id", post.id).order("position").limit(1).maybeSingle();
    if (error) throw error;
    photoId = data?.photo_id ?? null;
  }
  if (photoId) {
    const { data: photo, error } = await supabase.from("photos").select("storage_path, display_path").eq("id", photoId).single();
    if (error) throw error;
    const { data, error: downloadError } = await supabase.storage.from("photos").download(photo.display_path ?? photo.storage_path);
    if (downloadError || !data) throw downloadError ?? new Error("Photo indisponible");
    imagePath = await uploadMarketingImage(data, "share");
  }
  const { error } = await supabase.from("shooting_seo").upsert({ post_id: post.id, slug: post.slug, title: post.title, description: shootingDescription(post.title, post.category, post.body), image_path: imagePath, active: post.status === "published" });
  if (error) throw error;
}