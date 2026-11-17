import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Player from "@/components/Player";
import { getViewer } from "@/lib/auth";
import { getEpisodes, getSeriesBySlug, toPublicEpisodes } from "@/lib/data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ep?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  return s ? { title: `Assistir ${s.title}`, alternates: { canonical: `/serie/${s.slug}` } } : {};
}

export default async function WatchPage({ params, searchParams }: Props) {
  const [{ slug }, { ep }] = await Promise.all([params, searchParams]);
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();
  const [episodes, viewer] = await Promise.all([getEpisodes(series.id), getViewer()]);
  const start = Math.max(1, Number(ep) || 1);

  return (
    <Player
      seriesSlug={series.slug}
      seriesTitle={series.title}
      episodes={toPublicEpisodes(series, episodes)}
      startNumber={start}
      isSubscriber={viewer.isSubscriber}
      loggedIn={Boolean(viewer.user)}
    />
  );
}
