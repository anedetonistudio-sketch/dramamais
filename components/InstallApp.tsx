"use client";
import { useEffect, useState } from "react";

type Platform = "installed" | "ios" | "prompt" | "other";

function detect(): Platform {
  if (typeof window === "undefined") return "other";
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  if (standalone || localStorage.getItem("dm_installed") === "1") return "installed";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  if (isIOS) return "ios";
  if ((window as any).__dmInstallPrompt) return "prompt";
  return "other";
}

/**
 * Botão/banner "Instalar o app".
 * variant="card"   -> bloco fixo (Minha conta)
 * variant="banner" -> banner flutuante (aparece depois do 1º episódio assistido)
 */
export default function InstallApp({ variant = "card", onClose }: { variant?: "card" | "banner"; onClose?: () => void }) {
  const [platform, setPlatform] = useState<Platform>("other");
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const update = () => setPlatform(detect());
    update();
    window.addEventListener("dm:installable", update);
    window.addEventListener("dm:installed", update);
    return () => {
      window.removeEventListener("dm:installable", update);
      window.removeEventListener("dm:installed", update);
    };
  }, []);

  if (platform === "installed") {
    return variant === "card" ? (
      <div className="card text-sm text-white/70">✅ O app Drama+ já está instalado neste aparelho.</div>
    ) : null;
  }
  // banner só aparece onde dá para instalar de verdade
  if (variant === "banner" && platform === "other") return null;

  const install = async () => {
    const ev = (window as any).__dmInstallPrompt;
    if (ev) {
      ev.prompt();
      const choice = await ev.userChoice.catch(() => null);
      (window as any).__dmInstallPrompt = null;
      if (choice?.outcome === "accepted") localStorage.setItem("dm_installed", "1");
      setPlatform(detect());
      if (choice?.outcome === "accepted") onClose?.();
    } else {
      setShowIOS(true);
    }
  };

  const iosHelp = (
    <ol className="mt-3 space-y-1 text-sm text-white/80">
      <li>1. Toque em <b>Compartilhar</b> <span aria-hidden>⬆️</span> na barra do Safari</li>
      <li>2. Escolha <b>Adicionar à Tela de Início</b></li>
      <li>3. Toque em <b>Adicionar</b> — pronto, o Drama+ vira app!</li>
    </ol>
  );

  const body = (
    <div className="flex items-start gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-lg font-extrabold">D+</div>
      <div className="flex-1">
        <p className="font-semibold">Instale o app Drama+</p>
        <p className="text-sm text-white/70">Abra seus dramas direto da tela inicial, em tela cheia, como um app.</p>
        {platform === "ios" && (showIOS || variant === "card") ? (
          <>
            <p className="mt-2 text-sm text-white/80">No iPhone: toque em Compartilhar &gt; Adicionar à Tela de Início.</p>
            {iosHelp}
          </>
        ) : platform === "other" ? (
          <p className="mt-2 text-sm text-white/60">
            Abra o Drama+ no Chrome (Android) ou no Safari (iPhone) e use “Instalar app” / “Adicionar à Tela de Início”.
          </p>
        ) : (
          <button onClick={install} className="btn-primary mt-3 py-2 text-sm">Instalar o app</button>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Fechar" className="text-white/50 hover:text-white">✕</button>
      )}
    </div>
  );

  if (variant === "banner") {
    return (
      <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-ink-2/95 p-4 shadow-2xl backdrop-blur">
        {body}
      </div>
    );
  }
  return <div className="card">{body}</div>;
}
