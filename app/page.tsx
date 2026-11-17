import Link from "next/link";
import Cover from "@/components/Cover";
import SeriesCard from "@/components/SeriesCard";
import { COPY, PRICE_SHORT } from "@/lib/config";
import { getAllSeries, groupByGenre } from "@/lib/data";

export const revalidate = 60;

export default async function Home() {
  const all = await getAllSeries();
  const hero = all.find((s) => s.featured) ?? all[0];
  const rows = groupByGenre(all);

  return (
    <div className="mx-auto max-w-6xl">
      {/* HERO / posicionamento */}
      <section className="relative overflow-hidden px-4 pb-8 pt-6 sm:pt-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(255,46,99,.35),transparent_60%)]" />
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-gold">
              🇧🇷 {COPY.heroKicker}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">{COPY.heroTitle}</h1>
            <p className="mt-3 max-w-xl text-base text-white/80 sm:text-lg">{COPY.heroSubtitle}</p>
            <p className="mt-2 max-w-xl text-sm text-white/55">{COPY.priceCompare}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {hero && (
                <Link href={`/assistir/${hero.slug}?ep=1`} className="btn-primary">▶ Assistir grátis</Link>
              )}
              <Link href="/assinar" className="btn-ghost">Assinar por {PRICE_SHORT}</Link>
            </div>
          </div>
          {hero && (
            <Link href={`/serie/${hero.slug}`} className="hidden w-52 sm:block">
              <Cover series={hero} className="shadow-2xl shadow-brand/20" />
              <p className="mt-2 text-sm text-white/60">Em destaque: <b className="text-white">{hero.title}</b></p>
            </Link>
          )}
        </div>

        {hero && (
          <Link href={`/serie/${hero.slug}`} className="mt-6 flex gap-4 rounded-2xl border border-white/10 bg-ink-2 p-3 sm:hidden">
            <Cover series={hero} className="w-24 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-brand">Em destaque</p>
              <p className="font-bold">{hero.title}</p>
              <p className="mt-1 line-clamp-3 text-sm text-white/70">{hero.synopsis}</p>
            </div>
          </Link>
        )}
      </section>

      {/* Fileiras por gênero */}
      {rows.length === 0 && (
        <p className="px-4 text-white/60">Nenhuma série publicada ainda. Volte em breve!</p>
      )}
      {rows.map(([genre, list]) => (
        <section key={genre} className="mb-8">
          <h2 className="mb-3 px-4 text-lg font-bold">{genre}</h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
            {list.map((s) => <SeriesCard key={s.id} series={s} />)}
          </div>
        </section>
      ))}

      <section className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-6">
        <p className="text-xl font-extrabold">Tudo liberado por {PRICE_SHORT}</p>
        <p className="mt-1 text-white/90">Sem pagar por episódio, sem moedas. Dramas brasileiros, em português.</p>
        <Link href="/assinar" className="btn mt-4 bg-white text-black hover:bg-white/90">Quero assinar</Link>
      </section>
    </div>
  );
}
