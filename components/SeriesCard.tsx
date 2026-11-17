import Link from "next/link";
import Cover from "./Cover";
import type { Series } from "@/lib/types";

export default function SeriesCard({ series }: { series: Series }) {
  return (
    <Link href={`/serie/${series.slug}`} className="group block w-32 shrink-0 sm:w-40">
      <Cover series={series} className="transition group-hover:scale-[1.03]" />
      <p className="mt-2 line-clamp-1 text-sm font-semibold">{series.title}</p>
      <p className="text-xs text-white/50">
        {series.genre} · {series.episode_count} {series.episode_count === 1 ? "episódio" : "episódios"}
      </p>
    </Link>
  );
}
