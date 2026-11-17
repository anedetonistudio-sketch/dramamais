"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import InstallApp from "./InstallApp";
import { PRICE_SHORT, COPY } from "@/lib/config";
import type { PublicEpisode } from "@/lib/types";

type Props = {
  seriesSlug: string;
  seriesTitle: string;
  episodes: PublicEpisode[];
  startNumber: number;
  isSubscriber: boolean;
  loggedIn: boolean;
};

type Source = { url?: string; locked?: boolean; error?: string };

/** Player vertical 9:16 em tela cheia, estilo feed: rola para o próximo episódio e faz autoplay. */
export default function Player({ seriesSlug, seriesTitle, episodes, startNumber, isSubscriber, loggedIn }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const videos = useRef<Record<number, HTMLVideoElement | null>>({});
  const [active, setActive] = useState(() => Math.min(Math.max(startNumber, 1), Math.max(episodes.length, 1)));
  const [sources, setSources] = useState<Record<number, Source>>({});
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInstall, setShowInstall] = useState(false);

  const isLocked = (ep: PublicEpisode) => !ep.free && !isSubscriber;

  // busca a URL (assinada) de um episódio — uma vez por episódio
  const requested = useRef(new Set<number>());
  const load = useCallback((ep: PublicEpisode | undefined) => {
    if (!ep || requested.current.has(ep.number)) return;
    requested.current.add(ep.number);
    if (!ep.free && !isSubscriber) {
      setSources((p) => ({ ...p, [ep.number]: { locked: true } }));
      return;
    }
    fetch(`/api/video/${encodeURIComponent(ep.id)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        setSources((p) => ({
          ...p,
          [ep.number]: r.status === 402 ? { locked: true } : r.ok ? { url: j.url } : { error: j.error || "Erro ao carregar" },
        }));
      })
      .catch(() => setSources((p) => ({ ...p, [ep.number]: { error: "Sem conexão" } })));
  }, [isSubscriber]);

  // rolar até o episódio inicial
  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-ep="${active}"]`);
    el?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // detectar qual episódio está na tela
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const n = Number((e.target as HTMLElement).dataset.ep);
            setActive(n);
          }
        }
      },
      { root, threshold: [0.6] }
    );
    root.querySelectorAll("[data-ep]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [episodes.length]);

  // carregar atual + próximo; tocar só o ativo; atualizar URL
  useEffect(() => {
    const idx = episodes.findIndex((e) => e.number === active);
    load(episodes[idx]);
    load(episodes[idx + 1]);
    Object.entries(videos.current).forEach(([n, v]) => {
      if (!v) return;
      if (Number(n) === active) {
        v.muted = muted;
        v.play().then(() => setPaused(false)).catch(() => setPaused(true));
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
    setProgress(0);
    const url = new URL(window.location.href);
    url.searchParams.set("ep", String(active));
    window.history.replaceState(null, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sources[active]?.url]);

  const goTo = (n: number) => {
    scroller.current?.querySelector<HTMLElement>(`[data-ep="${n}"]`)?.scrollIntoView({ behavior: "smooth" });
  };

  const onEnded = (n: number) => {
    // 1º episódio assistido -> oferecer instalar o app (uma vez)
    try {
      if (!localStorage.getItem("dm_first_watch")) {
        localStorage.setItem("dm_first_watch", "1");
        if (!localStorage.getItem("dm_install_dismissed")) setShowInstall(true);
      }
    } catch {}
    const next = episodes.find((e) => e.number > n);
    if (next) goTo(next.number);
  };

  const togglePlay = (n: number) => {
    const v = videos.current[n];
    if (!v) return;
    if (muted) {
      setMuted(false);
      v.muted = false;
      v.play().catch(() => {});
      setPaused(false);
      return;
    }
    if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
  };

  if (episodes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black p-6 text-center">
        <div>
          <p>Esta série ainda não tem episódios.</p>
          <Link href={`/serie/${seriesSlug}`} className="btn-ghost mt-4">Voltar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div
        ref={scroller}
        className="no-scrollbar mx-auto h-dvh w-full max-w-[calc(100dvh*9/16)] snap-y snap-mandatory overflow-y-scroll overscroll-contain"
      >
        {episodes.map((ep) => {
          const src = sources[ep.number];
          const locked = isLocked(ep) || src?.locked;
          const near = Math.abs(ep.number - active) <= 1;
          return (
            <section key={ep.id} data-ep={ep.number} className="relative h-dvh w-full snap-start snap-always overflow-hidden bg-ink">
              {locked ? (
                <div className="flex h-full items-center bg-gradient-to-b from-ink-3 to-black p-5">
                  <div className="w-full text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/20 text-2xl">🔒</div>
                    <p className="mt-3 text-sm text-white/60">Episódio {ep.number} · exclusivo para assinantes</p>
                    <p className="mt-2 text-2xl font-extrabold">Continue a história por {PRICE_SHORT}</p>
                    <p className="mt-2 text-sm text-white/80">Assine e assista tudo — sem pagar por episódio, sem moedas.</p>
                    <ul className="mx-auto mt-4 max-w-xs space-y-1 text-left text-sm text-white/75">
                      {COPY.bullets.slice(0, 3).map((b) => <li key={b}>✓ {b}</li>)}
                    </ul>
                    <Link href={loggedIn ? "/assinar" : "/entrar?next=/assinar"} className="btn-primary mt-5 w-full max-w-xs">
                      Assinar por {PRICE_SHORT}
                    </Link>
                  </div>
                </div>
              ) : src?.error ? (
                <div className="grid h-full place-items-center p-6 text-center text-white/70">{src.error}</div>
              ) : near && src?.url ? (
                <video
                  ref={(el) => { videos.current[ep.number] = el; }}
                  src={src.url}
                  className="h-full w-full object-cover"
                  playsInline
                  muted={muted}
                  preload="auto"
                  onClick={() => togglePlay(ep.number)}
                  onEnded={() => onEnded(ep.number)}
                  onTimeUpdate={(e) => {
                    if (ep.number === active) {
                      const v = e.currentTarget;
                      setProgress(v.duration ? v.currentTime / v.duration : 0);
                    }
                  }}
                  onLoadedData={(e) => {
                    if (ep.number === active) e.currentTarget.play().then(() => setPaused(false)).catch(() => setPaused(true));
                  }}
                />
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-brand" />
                </div>
              )}

              {/* camada de informações */}
              {!locked && (
                <>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pb-6">
                    <p className="text-sm font-bold">{seriesTitle}</p>
                    <p className="text-sm text-white/80">Ep. {ep.number}{ep.title ? ` · ${ep.title}` : ""}</p>
                  </div>
                  {ep.number === active && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
                      <div className="h-full bg-brand transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
                    </div>
                  )}
                  {ep.number === active && (muted || paused) && src?.url && (
                    <button
                      onClick={() => togglePlay(ep.number)}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 px-5 py-3 text-sm font-semibold"
                    >
                      {muted ? "🔊 Toque para ativar o som" : "▶ Continuar"}
                    </button>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>

      {/* topo: voltar + contador */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 mx-auto flex max-w-[calc(100dvh*9/16)] items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-3 pt-[max(12px,env(safe-area-inset-top))]">
        <Link href={`/serie/${seriesSlug}`} className="pointer-events-auto rounded-full bg-black/50 px-3 py-1.5 text-sm">← {seriesTitle}</Link>
        <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs">{active}/{episodes.length}</span>
      </div>

      {/* lateral: anterior/próximo (desktop) */}
      <div className="fixed right-3 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        <button onClick={() => goTo(active - 1)} disabled={active <= 1} className="rounded-full bg-white/10 p-3 disabled:opacity-30" aria-label="Episódio anterior">▲</button>
        <button onClick={() => goTo(active + 1)} disabled={active >= episodes.length} className="rounded-full bg-white/10 p-3 disabled:opacity-30" aria-label="Próximo episódio">▼</button>
      </div>

      {showInstall && (
        <InstallApp
          variant="banner"
          onClose={() => {
            setShowInstall(false);
            try { localStorage.setItem("dm_install_dismissed", "1"); } catch {}
          }}
        />
      )}
    </div>
  );
}
