import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import InstallApp from "@/components/InstallApp";
import { getViewer } from "@/lib/auth";
import { PRICE_LABEL } from "@/lib/config";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Ativa", cls: "bg-emerald-500/15 text-emerald-300" },
  pending: { label: "Aguardando pagamento", cls: "bg-yellow-500/15 text-yellow-300" },
  paused: { label: "Pausada", cls: "bg-orange-500/15 text-orange-300" },
  cancelled: { label: "Cancelada", cls: "bg-red-500/15 text-red-300" },
  inactive: { label: "Inativa", cls: "bg-white/10 text-white/70" },
};

export default async function AccountPage() {
  const demo = isDemoMode();
  const viewer = await getViewer();
  if (!demo && !viewer.user) redirect("/entrar?next=/conta");

  const sub = viewer.subscription;
  const st = STATUS[sub?.status ?? "inactive"] ?? STATUS.inactive;

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 pt-8">
      <h1 className="text-2xl font-extrabold">Minha conta</h1>

      {demo ? (
        <div className="card text-sm text-white/70">Modo demonstração: não há conta logada.</div>
      ) : (
        <div className="card">
          <p className="text-sm text-white/60">E-mail</p>
          <p className="font-semibold">{viewer.user?.email}</p>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between">
          <p className="font-bold">Assinatura</p>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
        </div>
        {viewer.isSubscriber ? (
          <>
            <p className="mt-2 text-sm text-white/70">Plano Mensal · {PRICE_LABEL}. Todos os episódios liberados.</p>
            {sub?.current_period_end && (
              <p className="mt-1 text-sm text-white/60">
                Próxima cobrança: {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
              </p>
            )}
            <p className="mt-3 text-xs text-white/50">
              Para cancelar, acesse sua conta do Mercado Pago &gt; Assinaturas. O acesso fica ativo até o fim do período pago.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/70">
              {sub?.status === "pending"
                ? "Estamos aguardando a confirmação do Mercado Pago. Isso costuma levar poucos minutos."
                : `Assine por ${PRICE_LABEL} e libere todos os episódios — sem pagar por episódio, sem moedas.`}
            </p>
            <Link href="/assinar" className="btn-primary mt-4 w-full">Assinar agora</Link>
          </>
        )}
      </div>

      <InstallApp variant="card" />

      {viewer.isAdmin && <Link href="/admin" className="btn-ghost w-full">Painel admin</Link>}
      {!demo && (
        <form action="/auth/sair" method="post">
          <button className="btn-ghost w-full">Sair</button>
        </form>
      )}
    </div>
  );
}
