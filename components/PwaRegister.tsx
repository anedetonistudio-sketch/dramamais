"use client";
import { useEffect } from "react";

/** Registra o service worker e guarda o evento de instalação (Android/Chrome). */
export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__dmInstallPrompt = e;
      window.dispatchEvent(new Event("dm:installable"));
    };
    const onInstalled = () => {
      (window as any).__dmInstallPrompt = null;
      localStorage.setItem("dm_installed", "1");
      window.dispatchEvent(new Event("dm:installed"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
