import { createServerFn } from "@tanstack/react-start";

export const getAppearance = createServerFn({ method: "GET" }).handler(async () => {
  const { getSupabasePublicConfig, publicMediaClient } = await import("./public-media.server");
  const config = getSupabasePublicConfig();
  if (!config) throw new Error("Configuration Supabase publique indisponible.");
  const client = publicMediaClient(config.url, config.key);
  const { data, error } = await client
    .from("site_appearance")
    .select("hero_path, share_path")
    .eq("id", "home")
    .maybeSingle();
  if (error) throw error;
  const version = (path: string | null | undefined) =>
    path?.match(/^marketing\/([0-9a-f-]{36})-(?:hero|share)\.jpg$/)?.[1] ?? null;
  return {
    customHero: Boolean(data?.hero_path),
    heroVersion: version(data?.hero_path),
    customShare: Boolean(data?.share_path),
    shareVersion: version(data?.share_path),
  };
});
