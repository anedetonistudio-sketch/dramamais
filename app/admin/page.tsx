import type { Metadata } from "next";
import Link from "next/link";
import Cover from "@/components/Cover";
import SeriesForm from "./SeriesForm";
import { requireAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import type { Series } from "@/lib/types";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const gate = await requireAdmin();
  if (gate.demo) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-8">
        <h1 className="text-2xl font-extrabold">Admin</h1>
        <p className="card mt-4 text-sm text-white/70">
          Modo demonstração. Configure o Supabase e marque seu usuário como admin
          (<code>update profiles set is_admin = true where email = &apos;seu@email&apos;</code>) para gerenciar séries e episódios.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.from("series").select("*, episodes(count)").order("created_at", { ascending: false });
  const list = (data ?? []).map((s: any) => ({ ...s, episode_count: s.episodes?.[0]?.count ?? 0 })) as Series[];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <h1 className="text-2xl font-extrabold">Admin · Séries</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {list.map((s) => (
          <Link key={s.id} href={`/admin/serie/${s.id}`} className="card flex gap-3 hover:border-brand/50">
            <Cover series={s} className="w-16 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-bold">{s.title}</p>
              <p className="text-xs text-white/60">{s.genre} · {s.episode_count} eps · {s.free_episodes} grátis</p>
              <p className="mt-1 text-xs">
                {s.published ? <span className="text-emerald-400">Publicada</span> : <span className="text-white/50">Rascunho</span>}
                {s.featured && <span className="ml-2 text-brand-gold">★ Destaque</span>}
              </p>
            </div>
          </Link>
        ))}
        {list.length === 0 && <p className="text-white/60">Nenhuma série ainda. Crie a primeira abaixo.</p>}
      </div>

      <h2 className="mt-10 text-xl font-bold">Nova série</h2>
      <SeriesForm />
    </div>
  );
}
