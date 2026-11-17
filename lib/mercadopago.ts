import "server-only";

const MP_API = "https://api.mercadopago.com";

export async function mpFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN ausente");
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${JSON.stringify(body)}`);
  return body as T;
}

/** Status do preapproval no MP -> status no Drama+ */
export function mapStatus(mp: string): string {
  switch (mp) {
    case "authorized": return "active";
    case "paused": return "paused";
    case "cancelled": return "cancelled";
    case "pending": return "pending";
    default: return "inactive";
  }
}
