import "server-only";
import { isDemoMode } from "./env";
import { createClient } from "./supabase/server";

export type Viewer = {
  user: { id: string; email: string | null } | null;
  isAdmin: boolean;
  isSubscriber: boolean;
  subscription: { status: string; plan: string | null; current_period_end: string | null; mp_preapproval_id: string | null } | null;
};

const EMPTY: Viewer = { user: null, isAdmin: false, isSubscriber: false, subscription: null };

/** Quem está vendo a página: usuário, admin e se a assinatura está ativa. */
export async function getViewer(): Promise<Viewer> {
  if (isDemoMode()) return EMPTY;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return EMPTY;
  const [{ data: profile }, { data: subs }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, plan, current_period_end, mp_preapproval_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);
  const active = subs?.find((s) => s.status === "active") ?? null;
  return {
    user: { id: user.id, email: user.email ?? null },
    isAdmin: Boolean(profile?.is_admin),
    isSubscriber: Boolean(active),
    subscription: active ?? subs?.[0] ?? null,
  };
}
