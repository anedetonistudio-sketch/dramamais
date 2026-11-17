import type { Series } from "@/lib/types";

/** Capa vertical (2:3). Sem imagem, mostra um gradiente com o título. */
export default function Cover({ series, className = "" }: { series: Pick<Series, "title" | "cover_url" | "genre">; className?: string }) {
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-gradient-to-br from-brand/70 to-ink-3 ${className}`}>
      {series.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={series.cover_url} alt={series.title} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-end p-3">
          <span className="text-lg font-extrabold leading-tight">{series.title}</span>
        </div>
      )}
    </div>
  );
}
