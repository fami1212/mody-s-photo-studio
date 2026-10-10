import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugSchema = z.object({ slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/) });
const tokenSchema = z.object({ token: z.string().trim().min(16).max(64).regex(/^[A-Za-z0-9_-]+$/) });

const SIGNED_TTL = 60 * 60 * 24; // 24h

type PublicPhoto = { id: string; url: string; downloadUrl?: string; fileName?: string };

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function pick(
  photo: { storage_path: string; thumb_path?: string | null; display_path?: string | null },
  kind: "thumb" | "display",
): string {
  return (kind === "thumb" ? photo.thumb_path : photo.display_path) ?? photo.display_path ?? photo.storage_path;
}

async function signPaths(
  paths: string[],
  options?: { download?: boolean; names?: Record<string, string> },
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const admin = await getAdmin();
  const map: Record<string, string> = {};
  const { data } = await admin.storage.from("photos").createSignedUrls(paths, SIGNED_TTL, {
    download: options?.download ? true : false,
  });
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

/** Latest photos from published posts — used by the public home gallery. */
export const listRecentPublishedPhotos = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await getAdmin();
  const { data: posts } = await admin
    .from("posts")
    .select("id, slug, title")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(12);
  if (!posts || posts.length === 0) return { photos: [] as (PublicPhoto & { slug: string })[] };

  const { data: links } = await admin
    .from("post_photos")
    .select("post_id, photo_id, position, photos(id, storage_path, thumb_path, display_path, width, height)")
    .in(
      "post_id",
      posts.map((p) => p.id),
    )
    .order("position", { ascending: true })
    .limit(24);

  const rows = (links ?? []).filter((l) => l.photos);
  const signed = await signPaths(rows.map((l) => pick((l.photos as any), "thumb")));
  const bySlug = new Map(posts.map((p) => [p.id, p.slug]));

  return {
    photos: rows
      .map((l) => {
        const photo = l.photos as any;
        const url = signed[pick(photo, "thumb")];
        return url
          ? { id: photo.id as string, url, slug: bySlug.get(l.post_id as string) ?? "" }
          : null;
      })
      .filter(Boolean)
      .slice(0, 8) as (PublicPhoto & { slug: string })[],
  };
});

/** All published shootings for /shootings. */
export const listPublishedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await getAdmin();
  const { data: posts } = await admin
    .from("posts")
    .select("id, slug, title, category, body, shot_on, published_at, cover_photo_id")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const list = posts ?? [];
  const coverIds = list.map((p) => p.cover_photo_id).filter(Boolean) as string[];
  const { data: covers } = coverIds.length
    ? await admin.from("photos").select("id, storage_path, thumb_path, display_path").in("id", coverIds)
    : { data: [] as { id: string; storage_path: string }[] };
  const signed = await signPaths((covers ?? []).map((c) => pick(c, "display")));
  const coverUrl = new Map((covers ?? []).map((c) => [c.id, signed[pick(c, "display")]]));

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
    const admin = await getAdmin();
    const { data: post } = await admin
      .from("posts")
      .select("id, slug, title, category, body, shot_on, published_at, cover_photo_id")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!post) return { post: null };

    const { data: links } = await admin
      .from("post_photos")
      .select("photo_id, position, photos(id, storage_path, thumb_path, display_path, width, height)")
      .eq("post_id", post.id)
      .order("position", { ascending: true });

    const rows = (links ?? []).filter((l) => l.photos);
    const signed = await signPaths(rows.map((l) => pick(l.photos as any, "display")));
    const { data: seo } = await admin.from("shooting_seo").select("description, image_path").eq("post_id", post.id).eq("active", true).maybeSingle();
    const orderedRows = [...rows].sort((a, b) => Number(b.photo_id === post.cover_photo_id) - Number(a.photo_id === post.cover_photo_id));

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
              ? { id: photo.id as string, url, width: photo.width as number | null, height: photo.height as number | null }
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
    const { data: link } = await admin
      .from("share_links")
      .select("id, folder_id, label, is_active, expires_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!link || !link.is_active) return { status: "invalid" as const };
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      return { status: "expired" as const };
    }

    const { data: folder } = await admin
      .from("folders")
      .select("id, name, description")
      .eq("id", link.folder_id)
      .maybeSingle();
    if (!folder) return { status: "invalid" as const };

    const { data: photos } = await admin
      .from("photos")
      .select("id, storage_path, thumb_path, file_name, position")
      .eq("folder_id", folder.id)
      .order("position", { ascending: true });

    const rows = photos ?? [];
    const paths = rows.map((p) => p.storage_path);
    const view = await signPaths(rows.map((p) => pick(p, "thumb")));
    const download = await signPaths(paths, { download: true });

    return {
      status: "ok" as const,
      folder: { name: folder.name, description: folder.description, label: link.label },
      photos: rows.map((p) => ({
        id: p.id,
        url: view[pick(p, "thumb")] ?? "",
        downloadUrl: download[p.storage_path] ?? "",
        fileName: p.file_name ?? "photo.jpg",
      })),
    };
  });
