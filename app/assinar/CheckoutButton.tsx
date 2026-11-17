"use client";
import { useState } from "react";

export default function CheckoutButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/mp/checkout", { method: "POST" });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || "Não foi possível iniciar o pagamento");
      window.location.href = j.url;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={go} disabled={loading} className="btn-primary mt-5 w-full">
        {loading ? "Abrindo Mercado Pago…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </>
  );
}
