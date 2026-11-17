import "server-only";
import { DEFAULT_FREE_EPISODES } from "./config";
import { DEMO_SERIES, demoEpisodes, stripDemo } from "./demo";
import { isDemoMode } from "./env";
import { createClient } from "./supabase/server";
import type { Episode, PublicEpisode, Series } from "./types";

type Row = Omit<Series, "episode_count"> & { episodes?: { count: number }[] };
const normalize = (r: Row): Series => ({
  ...r,
  free_episodes: r.free_episodes ?? DEFAULT_FREE_EPISODES,
  episode_count: r.episodes?.[0]?.count ?? 0,
});

export async function getAllSeries(): Promise<Series[]> {
  if (isDemoMode()) return DEMO_SERIES.map(stripDemo);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("series")
    .select("*, episodes(count)")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllSeries", error.message);
    return [];
  }
  return (data as Row[]).map(normalize);
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  if (isDemoMode()) {
    const s = DEMO_SERIES.find((x) => x.slug === slug);
    return s ? stripDemo(s) : null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("series").select("*, episodes(count)").eq("slug", slug).maybeSingle();
  return data ? normalize(data as Row) : null;
}

export async function getEpisodes(seriesId: string): Promise<Episode[]> {
  if (isDemoMode()) return demoEpisodes(seriesId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("episodes")
    .select("id, series_id, number, title, video_path, duration_seconds")
    .eq("series_id", seriesId)
    .order("number", { ascending: true });
  return (data as Episode[]) ?? [];
}

export const toPublicEpisodes = (series: Series, eps: Episode[]): PublicEpisode[] =>
  eps.map((e) => ({ id: e.id, number: e.number, title: e.title, free: e.number <= series.free_episodes }));

export function groupByGenre(list: Series[]) {
  const map = new Map<string, Series[]>();
  for (const s of list) {
    const g = s.genre || "Outros";
    map.set(g, [...(map.get(g) ?? []), s]);
  }
  return [...map.entries()];
}
