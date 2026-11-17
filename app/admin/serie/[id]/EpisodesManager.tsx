"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Episode } from "@/lib/types";

const readDuration = (file: File) =>
  new Promise<number | null>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { resolve(Math.round(v.duration) || null); URL.revokeObjectURL(v.src); };
    v.onerror = () => resolve(null);
    v.src = URL.createObjectURL(file);
  });

export default function EpisodesManager({ seriesId, freeEpisodes, episodes }: { seriesId: string; freeEpisodes: number; episodes: Episode[] }) {
  const router = useRouter();
  const nextNumber = (episodes.at(-1)?.number ?? 0) + 1;
  const [number, setNumber] = useState(nextNumber);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return setMsg("Escolha pelo menos um vídeo.");
    const supabase = createClient();
    setMsg(null);
    try {
      // vários arquivos: numera em sequência a partir do número informado
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const n = Number(number) + i;
        setBusy(`Enviando episódio ${n} (${i + 1}/${files.length})… não feche a página`);
        const ext = file.name.split(".").pop() || "mp4";
        const path = `${seriesId}/${String(n).padStart(3, "0")}-${Date.now()}.${ext}`;
        const up = await supabase.storage.from("episodes").upload(path, file, { contentType: file.type || "video/mp4" });
        if (up.error) throw up.error;
        const duration = await readDuration(file);
        const old = episodes.find((x) => x.number === n);
        const { error } = await supabase.from("episodes").upsert(
          {
            series_id: seriesId,
            number: n,
            title: files.length === 1 ? title : old?.title || "",
            video_path: path,
            duration_seconds: duration,
          },
          { onConflict: "series_id,number" }
        );
        if (error) throw error;
        if (old?.video_path && old.video_path !== path) await supabase.storage.from("episodes").remove([old.video_path]);
      }
      setMsg("Episódio(s) enviado(s)!");
      setFiles([]);
      setTitle("");
      setNumber(Number(number) + files.length);
      router.refresh();
    } catch (err: any) {
      setMsg(`Erro: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const rename = async (ep: Episode, newTitle: string) => {
    const supabase = createClient();
    await supabase.from("episodes").update({ title: newTitle }).eq("id", ep.id);
    router.refresh();
  };

  const remove = async (ep: Episode) => {
    if (!confirm(`Apagar o episódio ${ep.number}?`)) return;
    const supabase = createClient();
    if (ep.video_path) await supabase.storage.from("episodes").remove([ep.video_path]);
    await supabase.from("episodes").delete().eq("id", ep.id);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-ink-2">
        {episodes.map((ep) => (
          <li key={ep.id} className="flex items-center gap-3 px-4 py-2">
            <span className="w-8 text-center font-extrabold text-white/50">{ep.number}</span>
            <input
              defaultValue={ep.title}
              onBlur={(e) => e.target.value !== ep.title && rename(ep, e.target.value)}
              className="flex-1 bg-transparent outline-none focus:underline"
              placeholder={`Episódio ${ep.number}`}
            />
            <span className="text-xs">{ep.number <= freeEpisodes ? <span className="text-emerald-400">Grátis</span> : "🔒"}</span>
            <span className="w-12 text-right text-xs text-white/50">{ep.duration_seconds ? `${ep.duration_seconds}s` : ""}</span>
            <button onClick={() => remove(ep)} className="text-xs text-red-300">Apagar</button>
          </li>
        ))}
        {episodes.length === 0 && <li className="px-4 py-3 text-white/50">Nenhum episódio ainda.</li>}
      </ul>

      <form onSubmit={upload} className="card space-y-4">
        <p className="font-semibold">Enviar episódio(s)</p>
        <p className="text-xs text-white/50">
          Vídeo vertical 9:16 (MP4/H.264). Selecione vários arquivos de uma vez para numerar em sequência.
          Enviar um número que já existe substitui o vídeo.
        </p>
        <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
          <div>
            <label className="label">Nº</label>
            <input className="input" type="number" min={1} value={number} onChange={(e) => setNumber(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Título {files.length > 1 && "(só para 1 arquivo)"}</label>
            <input className="input" value={title} disabled={files.length > 1} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <input className="input py-2 text-sm" type="file" accept="video/*" multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })))} />
        {busy && <p className="text-sm text-brand-gold">{busy}</p>}
        {msg && <p className={`text-sm ${msg.startsWith("Erro") ? "text-red-400" : "text-emerald-400"}`}>{msg}</p>}
        <button disabled={Boolean(busy)} className="btn-primary">{busy ? "Enviando…" : "Enviar"}</button>
      </form>
    </div>
  );
}
