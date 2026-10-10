import { createServerFn } from "@tanstack/react-start";

export const getAppearance = createServerFn({ method: "GET" }).handler(async () => {
  const { publicMediaClient } = await import("./public-media.server");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Configuration indisponible");
  const client = publicMediaClient(url, key);
  const { data, error } = await client.from("site_appearance").select("hero_path, share_path").eq("id", "home").maybeSingle();
  if (error) throw error;
  return { customHero: Boolean(data?.hero_path), customShare: Boolean(data?.share_path) };
});