import Link from "next/link";
import Logo from "./Logo";
import { COPY } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-ink-2/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Logo />
        <p className="mt-3 max-w-xl text-sm text-white/70">{COPY.footer}</p>
        <p className="mt-2 text-sm font-semibold text-brand-gold">🇧🇷 Feito no Brasil, em português.</p>
        <nav className="mt-6 flex flex-wrap gap-4 text-sm text-white/60">
          <Link href="/assinar">Assinar</Link>
          <Link href="/conta">Minha conta</Link>
          <Link href="/entrar">Entrar</Link>
        </nav>
        <p className="mt-6 text-xs text-white/40">© {new Date().getFullYear()} Drama+ · dramamais.com.br</p>
      </div>
    </footer>
  );
}
