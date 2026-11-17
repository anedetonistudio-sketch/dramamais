import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { mapStatus, mpFetch } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Preapproval = {
  id: string;
  status: string;
  external_reference?: string;
  next_payment_date?: string;
  auto_recurring?: { transaction_amount?: number };
};

/** Valida o cabeçalho x-signature (opcional: só se MP_WEBHOOK_SECRET estiver definido). */
function validSignature(req: Request, dataId: string | null) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const parts = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=") as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  let manifest = "";
  if (dataId) manifest += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${parts.ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

/**
 * Webhook do Mercado Pago.
 * Configure em: Suas integrações > Webhooks > URL = https://dramamais.com.br/api/mp/webhook
 * Eventos: "Planos e assinaturas" (subscription_preapproval e subscription_authorized_payment).
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({} as any));
  const type: string = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic") || "";
  const dataId: string | null = body?.data?.id?.toString() || url.searchParams.get("data.id") || url.searchParams.get("id");

  if (!validSignature(req, url.searchParams.get("data.id") || dataId)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }
  if (!dataId) return NextResponse.json({ ok: true, ignored: "sem id" });

  try {
    let preapprovalId: string | null = null;
    if (type.includes("subscription_preapproval") || type === "preapproval") {
      preapprovalId = dataId;
    } else if (type.includes("authorized_payment")) {
      const ap = await mpFetch<{ preapproval_id?: string }>(`/authorized_payments/${dataId}`);
      preapprovalId = ap.preapproval_id ?? null;
    } else {
      return NextResponse.json({ ok: true, ignored: type });
    }
    if (!preapprovalId) return NextResponse.json({ ok: true, ignored: "sem preapproval" });

    const pre = await mpFetch<Preapproval>(`/preapproval/${preapprovalId}`);
    const userId = pre.external_reference;
    if (!userId) return NextResponse.json({ ok: true, ignored: "sem external_reference" });

    const { error } = await createAdminClient().from("subscriptions").upsert(
      {
        user_id: userId,
        mp_preapproval_id: pre.id,
        status: mapStatus(pre.status),
        plan: "mensal",
        amount: pre.auto_recurring?.transaction_amount ?? null,
        current_period_end: pre.next_payment_date ?? null,
        raw: pre as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mp_preapproval_id" }
    );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, status: mapStatus(pre.status) });
  } catch (e: any) {
    console.error("mp webhook", e?.message);
    // 500 faz o Mercado Pago reenviar a notificação depois
    return NextResponse.json({ error: "falha ao processar" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "Drama+ MP webhook" });
}
