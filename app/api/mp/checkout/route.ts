import { NextResponse } from "next/server";
import { PLAN, SITE } from "@/lib/config";
import { isDemoMode } from "@/lib/env";
import { mpFetch } from "@/lib/mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Cria a assinatura (preapproval) no Mercado Pago e devolve o link de pagamento. */
export async function POST() {
  if (isDemoMode()) return NextResponse.json({ error: "Modo demonstração" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Faça login para assinar" }, { status: 401 });

  try {
    const pre = await mpFetch<{ id: string; init_point: string; status: string }>("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: PLAN.reason,
        external_reference: user.id,
        payer_email: user.email,
        back_url: `${SITE.url}/assinar?status=retorno`,
        status: "pending",
        auto_recurring: {
          frequency: PLAN.frequency,
          frequency_type: PLAN.frequencyType,
          transaction_amount: PLAN.price,
          currency_id: PLAN.currency,
        },
      }),
    });

    await createAdminClient().from("subscriptions").upsert(
      {
        user_id: user.id,
        mp_preapproval_id: pre.id,
        status: "pending",
        plan: PLAN.id,
        amount: PLAN.price,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mp_preapproval_id" }
    );

    return NextResponse.json({ url: pre.init_point });
  } catch (e: any) {
    console.error("checkout", e?.message);
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 500 });
  }
}
