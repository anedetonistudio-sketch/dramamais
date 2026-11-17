import { NextResponse } from "next/server";
import { findDemoEpisode } from "@/lib/demo";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_FREE_EPISODES } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Devolve a URL do vídeo de um episódio.
 * - Episódio grátis (number <= free_episodes): qualquer pessoa.
 * - Episódio bloqueado: só usuário logado com assinatura ativa.
 * Vídeos ficam no bucket PRIVADO "episodes" -> URL assinada que expira.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ episodeId: string }> }) {
  const { episodeId } = await params;
  const noStore = { "Cache-Control": "private, no-store" };

  if (isDemoMode()) {
    const found = findDemoEpisode(episodeId);
    if (!found) return NextResponse.json({ error: "Episódio não encontrado" }, { status: 404 });
    if (found.episode.number > found.series.free_episodes)
      return NextResponse.json({ error: "Exclusivo para assinantes" }, { status: 402, headers: noStore });
    return NextResponse.json({ url: found.episode.video_path }, { headers: noStore });
  }

  const supabase = await createClient();
  const { data: ep } = await supabase
    .from("episodes")
    .select("id, number, video_path, series:series_id(free_episodes)")
    .eq("id", episodeId)
    .maybeSingle();
  if (!ep || !ep.video_path) return NextResponse.json({ error: "Episódio não encontrado" }, { status: 404 });

  const seriesRel = ep.series as unknown as { free_episodes: number } | { free_episodes: number }[] | null;
  const free = (Array.isArray(seriesRel) ? seriesRel[0]?.free_episodes : seriesRel?.free_episodes) ?? DEFAULT_FREE_EPISODES;

  if (ep.number > free) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Faça login e assine para assistir" }, { status: 402, headers: noStore });
    const { data: ok } = await supabase.rpc("has_active_subscription", { uid: user.id });
    if (!ok) return NextResponse.json({ error: "Exclusivo para assinantes" }, { status: 402, headers: noStore });
  }

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage.from("episodes").createSignedUrl(ep.video_path, 60 * 60 * 2);
  if (error || !signed) return NextResponse.json({ error: "Não foi possível gerar o vídeo" }, { status: 500 });
  return NextResponse.json({ url: signed.signedUrl }, { headers: noStore });
}
