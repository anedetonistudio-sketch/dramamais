import Link from "next/link";
import Logo from "./Logo";
import { getViewer } from "@/lib/auth";
import { PRICE_SHORT } from "@/lib/config";

export default async function Header() {
  const viewer = await getViewer();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          {viewer.isAdmin && <Link href="/admin" className="px-2 text-white/70 hover:text-white">Admin</Link>}
          {!viewer.isSubscriber && (
            <Link href="/assinar" className="hidden rounded-full bg-brand px-3 py-1.5 font-semibold sm:inline-block">
              Assinar {PRICE_SHORT}
            </Link>
          )}
          {viewer.user ? (
            <Link href="/conta" className="rounded-full bg-white/10 px-3 py-1.5">Minha conta</Link>
          ) : (
            <Link href="/entrar" className="rounded-full bg-white/10 px-3 py-1.5">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
