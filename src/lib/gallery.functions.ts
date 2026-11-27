import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const slugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
});
const tokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(16)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/),
});

const SIGNED_TTL = 60 * 60 * 24; // 24h

type PublicPhoto = { id: string; url: string; downloadUrl?: string; fileName?: string };
type HomeShootingPhoto = PublicPhoto & { slug: string; title: string };
type GalleryClient = SupabaseClient<Database>;

async function getPublicClient(): Promise<GalleryClient> {
  const { getSupabasePublicConfig, publicMediaClient } = await import("./public-media.server");
  const config = getSupabasePublicConfig();
  if (!config) throw new Error("Configuration Supabase publique indisponible.");
  return publicMediaClient(config.url, config.key);
}

async function getAdmin(): Promise<GalleryClient> {
  const { createSupabaseServerAdminClient } = await import("./public-media.server");
  return createSupabaseServerAdminClient();
}

function pick(
  photo: { storage_path: string; thumb_path?: string | null; display_path?: string | null },
  kind: "thumb" | "display",
): string {
  return (
    (kind === "thumb" ? photo.thumb_path : photo.display_path) ??
    photo.display_path ??
    photo.storage_path
  );
}

async function signPaths(
  client: GalleryClient,
  paths: string[],
  options?: { download?: boolean; names?: Record<string, string> },
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const map: Record<string, string> = {};
  const { data, error } = await client.storage.from("photos").createSignedUrls(paths, SIGNED_TTL, {
    download: options?.download ? true : false,
  });
  if (error) throw error;
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

/** One cover photo per recent published shooting, shuffled for the public home gallery. */
export const listRecentPublishedPhotos = createServerFn({ method: "GET" }).handler(async () => {
  const client = await getPublicClient();
  const { data: posts, error: postsError } = await client
    .from("posts")
    .select("id, slug, title, cover_photo_id")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(12);
  if (postsError) throw postsError;
  if (!posts?.length) return { photos: [] as HomeShootingPhoto[] };

  const coverIds = posts
    .map((post) => post.cover_photo_id)
    .filter((id): id is string => Boolean(id));
  if (!coverIds.length) return { photos: [] as HomeShootingPhoto[] };

  const { data: covers, error: coversError } = await client
    .from("photos")
    .select("id, storage_path, thumb_path, display_path")
    .in("id", coverIds);
  if (coversError) throw coversError;

  const coversById = new Map((covers ?? []).map((photo) => [photo.id, photo]));
  const selected = posts.flatMap((post) => {
    const cover = post.cover_photo_id ? coversById.get(post.cover_photo_id) : null;
    return cover
      ? [{ id: cover.id, slug: post.slug, title: post.title, path: pick(cover, "thumb") }]
      : [];
  });
  const signed = await signPaths(
    client,
    selected.map((photo) => photo.path),
  );
  const photos: HomeShootingPhoto[] = selected.flatMap((photo) => {
    const url = signed[photo.path];
    return url ? [{ id: photo.id, slug: photo.slug, title: photo.title, url }] : [];
  });

  for (let index = photos.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentPhoto = photos[index];
    const randomPhoto = photos[randomIndex];
    if (currentPhoto && randomPhoto) {
      photos[index] = randomPhoto;
      photos[randomIndex] = currentPhoto;
    }
  }

  return { photos };
});

/** All published shootings for /shootings. */
export const listPublishedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const client = await getPublicClient();
  const { data: posts, error: postsError } = await client
    .from("posts")
    .select("id, slug, title, category, body, shot_on, published_at, cover_photo_id")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (postsError) throw postsError;

  const list = posts ?? [];
  const coverIds = list.map((p) => p.cover_photo_id).filter(Boolean) as string[];
  const coversResult = coverIds.length
    ? await client
        .from("photos")
        .select("id, storage_path, thumb_path, display_path")
        .in("id", coverIds)
    : null;
  if (coversResult?.error) throw coversResult.error;
  const covers = coversResult?.data ?? [];
  const signed = await signPaths(
    client,
    covers.map((c) => pick(c, "display")),
  );
  const coverUrl = new Map(covers.map((c) => [c.id, signed[pick(c, "display")]]));

  return {
    posts: list.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      excerpt: (p.body ?? "").slice(0, 160),
      shotOn: p.shot_on,
      publishedAt: p.published_at,
      cover: p.cover_photo_id ? (coverUrl.get(p.cover_photo_id) ?? null) : null,
    })),
  };
});

/** One published shooting with its gallery. */
export const getPublishedPost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slugSchema.parse(data))
  .handler(async ({ data }) => {
    const client = await getPublicClient();
    const { data: post, error: postError } = await client
      .from("posts")
      .select("id, slug, title, category, body, shot_on, published_at, cover_photo_id")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (postError) throw postError;
    if (!post) return { post: null };

    const { data: links, error: linksError } = await client
      .from("post_photos")
      .select(
        "photo_id, position, photos(id, storage_path, thumb_path, display_path, width, height)",
      )
      .eq("post_id", post.id)
      .order("position", { ascending: true });
    if (linksError) throw linksError;

    const rows = (links ?? []).filter((l) => l.photos);
    const signed = await signPaths(
      client,
      rows.map((l) => pick(l.photos as any, "display")),
    );
    const { data: seo, error: seoError } = await client
      .from("shooting_seo")
      .select("description, image_path")
      .eq("post_id", post.id)
      .eq("active", true)
      .maybeSingle();
    if (seoError) throw seoError;
    const orderedRows = [...rows].sort(
      (a, b) =>
        Number(b.photo_id === post.cover_photo_id) - Number(a.photo_id === post.cover_photo_id),
    );

    return {
      post: {
        slug: post.slug,
        title: post.title,
        category: post.category,
        body: post.body,
        shotOn: post.shot_on,
        publishedAt: post.published_at,
        seoDescription: seo?.description ?? null,
        hasShareImage: Boolean(seo?.image_path),
        photos: orderedRows
          .map((l) => {
            const photo = l.photos as any;
            const url = signed[pick(photo, "display")];
            return url
              ? {
                  id: photo.id as string,
                  url,
                  width: photo.width as number | null,
                  height: photo.height as number | null,
                }
              : null;
          })
          .filter(Boolean) as PublicPhoto[],
      },
    };
  });

/** Client-facing shared folder (download links). */
export const getSharedFolder = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: link, error: linkError } = await admin
      .from("share_links")
      .select("id, folder_id, label, is_active, expires_at")
      .eq("token", data.token)
      .maybeSingle();
    if (linkError) throw linkError;

    if (!link || !link.is_active) return { status: "invalid" as const };
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      return { status: "expired" as const };
    }

    const { data: folder, error: folderError } = await admin
      .from("folders")
      .select("id, name, description")
      .eq("id", link.folder_id)
      .maybeSingle();
    if (folderError) throw folderError;
    if (!folder) return { status: "invalid" as const };

    const { data: photos, error: photosError } = await admin
      .from("photos")
      .select("id, storage_path, thumb_path, file_name, position")
      .eq("folder_id", folder.id)
      .order("position", { ascending: true });
    if (photosError) throw photosError;

    const rows = photos ?? [];
    const paths = rows.map((photo) => photo.storage_path);
    const view = await signPaths(
      admin,
      rows.map((photo) => pick(photo, "thumb")),
    );
    const download = await signPaths(admin, paths, { download: true });

    return {
      status: "ok" as const,
      folder: { name: folder.name, description: folder.description, label: link.label },
      photos: rows.map((photo) => ({
        id: photo.id,
        url: view[pick(photo, "thumb")] ?? "",
        downloadUrl: download[photo.storage_path] ?? "",
        fileName: photo.file_name ?? "photo.jpg",
      })),
    };
  });
