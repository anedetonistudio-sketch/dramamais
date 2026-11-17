import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SeriesForm from "../../SeriesForm";
import EpisodesManager from "./EpisodesManager";
import { requireAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import type { Episode, Series } from "@/lib/types";

export const metadata: Metadata = { title: "Editar série", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (gate.demo) notFound();

  const supabase = await createClient();
  const [{ data: series }, { data: episodes }] = await Promise.all([
    supabase.from("series").select("*").eq("id", id).maybeSingle(),
    supabase.from("episodes").select("*").eq("series_id", id).order("number"),
  ]);
  if (!series) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <Link href="/admin" className="text-sm text-white/60">← Todas as séries</Link>
      <h1 className="mt-2 text-2xl font-extrabold">{series.title}</h1>
      <Link href={`/serie/${series.slug}`} className="text-sm text-brand underline">Ver no site</Link>
      <SeriesForm series={{ ...(series as Series), episode_count: episodes?.length ?? 0 }} />
      <h2 className="mt-10 text-xl font-bold">Episódios</h2>
      <EpisodesManager seriesId={series.id} freeEpisodes={series.free_episodes} episodes={(episodes ?? []) as Episode[]} />
    </div>
  );
}
