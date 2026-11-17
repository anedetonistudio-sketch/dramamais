import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "./AuthForm";
import { getViewer } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Entrar ou criar conta", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; modo?: string }> }) {
  const { next, modo } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/conta";
  const viewer = await getViewer();
  if (viewer.user) redirect(safeNext);

  return (
    <div className="mx-auto max-w-sm px-4 pt-10">
      {isDemoMode() ? (
        <div className="card text-sm text-white/70">
          Modo demonstração: cadastro e login ficam ativos quando o Supabase estiver configurado (veja o README).
        </div>
      ) : (
        <AuthForm next={safeNext} initialMode={modo === "cadastro" ? "signup" : "signin"} />
      )}
    </div>
  );
}
