import type { Metadata } from "next";
import Link from "next/link";
import CheckoutButton from "./CheckoutButton";
import { getViewer } from "@/lib/auth";
import { COPY, PLAN, PRICE_LABEL, PRICE_SHORT, formatBRL } from "@/lib/config";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = {
  title: `Assinar por ${PRICE_SHORT}`,
  description: `Assine o Drama+ por ${PRICE_SHORT} e assista todos os microdramas brasileiros — sem pagar por episódio, sem moedas.`,
  alternates: { canonical: "/assinar" },
};

export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ status }, viewer] = await Promise.all([searchParams, getViewer()]);
  const demo = isDemoMode();

  return (
    <div className="mx-auto max-w-lg px-4 pt-8">
      <span className="inline-flex rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-bold uppercase text-brand-gold">🇧🇷 100% brasileiro</span>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight">Um preço só. Tudo liberado.</h1>
      <p className="mt-2 text-white/80">{COPY.heroSubtitle}</p>
      <p className="mt-2 text-sm text-white/55">{COPY.priceCompare}</p>

      {status === "retorno" && (
        <div className="card mt-5 border-emerald-500/40 text-sm">
          Recebemos seu retorno do Mercado Pago! Assim que o pagamento for confirmado, sua assinatura é ativada
          automaticamente (normalmente em poucos minutos). Veja em <Link className="underline" href="/conta">Minha conta</Link>.
        </div>
      )}

      <div className="card mt-6 border-brand/50 bg-gradient-to-b from-brand/15 to-ink-2">
        <p className="text-sm font-bold uppercase text-brand">Plano {PLAN.name}</p>
        <p className="mt-1">
          <span className="text-4xl font-extrabold">{formatBRL(PLAN.price)}</span>
          <span className="text-white/60">/mês</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {COPY.bullets.map((b) => <li key={b}>✓ {b}</li>)}
        </ul>

        {viewer.isSubscriber ? (
          <div className="mt-5 rounded-xl bg-emerald-500/15 p-3 text-sm text-emerald-300">
            Sua assinatura está ativa. Bom drama! 🍿 <Link href="/" className="underline">Ir para o catálogo</Link>
          </div>
        ) : demo ? (
          <p className="mt-5 rounded-xl bg-white/5 p-3 text-sm text-white/70">
            Modo demonstração: o checkout do Mercado Pago é ativado quando o Supabase e o MP_ACCESS_TOKEN estiverem configurados.
          </p>
        ) : viewer.user ? (
          <CheckoutButton label={`Assinar por ${PRICE_LABEL}`} />
        ) : (
          <Link href="/entrar?next=/assinar" className="btn-primary mt-5 w-full">Criar conta e assinar</Link>
        )}
        <p className="mt-3 text-center text-xs text-white/50">
          Cobrança mensal recorrente pelo Mercado Pago (cartão). Cancele quando quiser.
        </p>
      </div>
    </div>
  );
}
