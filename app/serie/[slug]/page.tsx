import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cover from "@/components/Cover";
import { getViewer } from "@/lib/auth";
import { PRICE_SHORT } from "@/lib/config";
import { getEpisodes, getSeriesBySlug } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) return {};
  const description = `${s.synopsis.slice(0, 150)} — Assista no Drama+, microdramas 100% brasileiros por ${PRICE_SHORT}.`;
  return {
    title: s.title,
    description,
    alternates: { canonical: `/serie/${s.slug}` },
    openGraph: { title: `${s.title} | Drama+`, description, images: s.cover_url ? [{ url: s.cover_url }] : undefined },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();
  const [episodes, viewer] = await Promise.all([getEpisodes(series.id), getViewer()]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <div className="flex gap-4">
        <Cover series={series} className="w-32 shrink-0 sm:w-44" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-brand">{series.genre}</p>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{series.title}</h1>
          <p className="mt-1 text-sm text-white/60">
            {episodes.length} episódios · {series.free_episodes} grátis
          </p>
          {episodes.length > 0 && (
            <Link href={`/assistir/${series.slug}?ep=1`} className="btn-primary mt-4">▶ Assistir ep. 1</Link>
          )}
        </div>
      </div>

      <h2 className="mt-6 font-bold">Sinopse</h2>
      <p className="mt-1 whitespace-pre-line text-white/80">{series.synopsis}</p>

      <h2 className="mt-6 font-bold">Episódios</h2>
      <ul className="mt-2 divide-y divide-white/5 rounded-2xl border border-white/10 bg-ink-2">
        {episodes.map((ep) => {
          const locked = ep.number > series.free_episodes && !viewer.isSubscriber;
          return (
            <li key={ep.id}>
              <Link href={`/assistir/${series.slug}?ep=${ep.number}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
                <span className="w-8 text-center text-lg font-extrabold text-white/40">{ep.number}</span>
                <span className="flex-1 truncate">{ep.title || `Episódio ${ep.number}`}</span>
                {locked ? (
                  <span className="flex items-center gap-1 text-xs text-brand-gold" title="Exclusivo para assinantes">🔒 Assinantes</span>
                ) : ep.number <= series.free_episodes ? (
                  <span className="text-xs text-emerald-400">Grátis</span>
                ) : (
                  <span className="text-xs text-white/50">▶</span>
                )}
              </Link>
            </li>
          );
        })}
        {episodes.length === 0 && <li className="px-4 py-3 text-white/50">Episódios em breve.</li>}
      </ul>

      {!viewer.isSubscriber && episodes.length > series.free_episodes && (
        <div className="card mt-6">
          <p className="font-bold">Gostou? Libere todos os episódios por {PRICE_SHORT}.</p>
          <p className="mt-1 text-sm text-white/70">Sem pagar por episódio, sem moedas. Cancele quando quiser.</p>
          <Link href="/assinar" className="btn-primary mt-3">Assinar agora</Link>
        </div>
      )}
    </div>
  );
}
