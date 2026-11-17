"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ next, initialMode }: { next: string; initialMode: "signin" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg({ ok: false, text: error.message.includes("Invalid") ? "E-mail ou senha incorretos." : error.message });
        setLoading(false);
        return;
      }
      window.location.href = next;
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setMsg({ ok: false, text: error.message.includes("registered") ? "Este e-mail já tem conta. Faça login." : error.message });
        setLoading(false);
        return;
      }
      if (data.session) {
        window.location.href = next;
      } else {
        setMsg({ ok: true, text: "Conta criada! Confirme pelo link que enviamos para o seu e-mail." });
        setLoading(false);
      }
    }
  };

  const reset = async () => {
    if (!email) return setMsg({ ok: false, text: "Digite seu e-mail acima para recuperar a senha." });
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/conta` });
    setMsg({ ok: true, text: "Se o e-mail existir, enviamos um link para redefinir a senha." });
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">{mode === "signin" ? "Entrar" : "Criar conta"}</h1>
        <p className="text-sm text-white/60">
          {mode === "signin" ? "Bem-vindo de volta ao Drama+." : "Leva 30 segundos. Depois é só assinar e maratonar."}
        </p>
      </div>
      {mode === "signup" && (
        <div>
          <label className="label" htmlFor="name">Nome</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input id="password" type="password" required minLength={6} className="input" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>}
      <button disabled={loading} className="btn-primary w-full">
        {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
      </button>
      <div className="flex justify-between text-sm text-white/60">
        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }} className="underline">
          {mode === "signin" ? "Criar conta" : "Já tenho conta"}
        </button>
        {mode === "signin" && <button type="button" onClick={reset} className="underline">Esqueci a senha</button>}
      </div>
    </form>
  );
}
