"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_FREE_EPISODES } from "@/lib/config";
import type { Series } from "@/lib/types";

const GENRES = ["Romance", "Drama", "Suspense", "Vingança", "Família", "Comédia", "CEO / Bilionário", "Sobrenatural"];

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function SeriesForm({ series }: { series?: Series }) {
  const router = useRouter();
  const [title, setTitle] = useState(series?.title ?? "");
  const [slug, setSlug] = useState(series?.slug ?? "");
  const [synopsis, setSynopsis] = useState(series?.synopsis ?? "");
  const [genre, setGenre] = useState(series?.genre ?? "Romance");
  const [free, setFree] = useState(series?.free_episodes ?? DEFAULT_FREE_EPISODES);
  const [featured, setFeatured] = useState(series?.featured ?? false);
  const [published, setPublished] = useState(series?.published ?? true);
  const [cover, setCover] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const payload = {
      title,
      slug: slug || slugify(title),
      synopsis,
      genre,
      free_episodes: Number(free),
      featured,
      published,
      updated_at: new Date().toISOString(),
    };
    try {
      let id = series?.id;
      if (id) {
        const { error } = await supabase.from("series").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("series").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      if (cover && id) {
        const ext = cover.name.split(".").pop() || "jpg";
        const path = `${id}/${Date.now()}.${ext}`;
        const up = await supabase.storage.from("covers").upload(path, cover, { upsert: true, contentType: cover.type });
        if (up.error) throw up.error;
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
        const { error } = await supabase.from("series").update({ cover_url: pub.publicUrl }).eq("id", id);
        if (error) throw error;
      }
      setMsg("Salvo!");
      if (!series) router.push(`/admin/serie/${id}`);
      else router.refresh();
    } catch (err: any) {
      setMsg(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!series || !confirm(`Apagar "${series.title}" e todos os episódios?`)) return;
    const supabase = createClient();
    const { data: files } = await supabase.storage.from("episodes").list(series.id, { limit: 1000 });
    if (files?.length) await supabase.storage.from("episodes").remove(files.map((f) => `${series.id}/${f.name}`));
    const { error } = await supabase.from("series").delete().eq("id", series.id);
    if (error) return setMsg(`Erro: ${error.message}`);
    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={save} className="card mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Título</label>
          <input className="input" required value={title}
            onChange={(e) => { setTitle(e.target.value); if (!series) setSlug(slugify(e.target.value)); }} />
        </div>
        <div>
          <label className="label">Slug (endereço)</label>
          <input className="input" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="amor-de-aluguel" />
        </div>
      </div>
      <div>
        <label className="label">Sinopse</label>
        <textarea className="input min-h-28" value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Gênero</label>
          <input className="input" list="genres" value={genre} onChange={(e) => setGenre(e.target.value)} />
          <datalist id="genres">{GENRES.map((g) => <option key={g} value={g} />)}</datalist>
        </div>
        <div>
          <label className="label">Episódios grátis</label>
          <input className="input" type="number" min={0} value={free} onChange={(e) => setFree(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Capa (vertical 2:3)</label>
          <input className="input py-2 text-sm" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publicada</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Destaque na home</label>
      </div>
      {msg && <p className={`text-sm ${msg.startsWith("Erro") ? "text-red-400" : "text-emerald-400"}`}>{msg}</p>}
      <div className="flex gap-3">
        <button disabled={saving} className="btn-primary">{saving ? "Salvando…" : series ? "Salvar alterações" : "Criar série"}</button>
        {series && <button type="button" onClick={remove} className="btn-ghost text-red-300">Apagar série</button>}
      </div>
    </form>
  );
}
