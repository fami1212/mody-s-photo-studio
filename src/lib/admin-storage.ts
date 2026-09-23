import { supabase } from "@/integrations/supabase/client";

export const PHOTOS_BUCKET = "photos";

/** Signed preview URLs for private photo paths (admin side, 1h). */
export async function signPreviewUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrls(paths, 3600);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}
