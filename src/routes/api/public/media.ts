import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/media")({
  server: { handlers: { GET: async ({ request }) => {
    const params = new URL(request.url).searchParams;
    const parsed = z.object({ kind: z.enum(["hero", "home-share", "shooting"]), slug: z.string().max(120).regex(/^[a-z0-9-]+$/).optional() }).safeParse({ kind: params.get("kind"), slug: params.get("slug") ?? undefined });
    if (!parsed.success) return new Response("Invalid request", { status: 400 });
    const { publicMediaClient } = await import("@/lib/public-media.server");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return new Response("Unavailable", { status: 503 });
    const client = publicMediaClient(url, key);
    let path: string | null = null;
    if (parsed.data.kind === "shooting") {
      if (!parsed.data.slug) return new Response("Not found", { status: 404 });
      const { data, error } = await client.from("shooting_seo").select("image_path").eq("slug", parsed.data.slug).eq("active", true).maybeSingle();
      if (error) return new Response("Unavailable", { status: 503 });
      path = data?.image_path ?? null;
    } else {
      const { data, error } = await client.from("site_appearance").select("hero_path, share_path").eq("id", "home").maybeSingle();
      if (error) return new Response("Unavailable", { status: 503 });
      path = parsed.data.kind === "hero" ? data?.hero_path ?? null : data?.share_path ?? null;
    }
    if (!path) return new Response("Not found", { status: 404 });
    const { data, error } = await client.storage.from("photos").download(path);
    if (error || !data) return new Response("Not found", { status: 404 });
    return new Response(data, { headers: { "Content-Type": data.type || "image/jpeg", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" } });
  } } },
});