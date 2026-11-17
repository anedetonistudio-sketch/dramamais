import Link from "next/link";
import { COPY, PRICE_LABEL, PRICE_SHORT } from "@/lib/config";

export default function Paywall({ episodeNumber, compact = false, loggedIn = false }: { episodeNumber?: number; compact?: boolean; loggedIn?: boolean }) {
  return (
    <div className={`mx-auto w-full max-w-sm text-center ${compact ? "" : "card"}`}>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/20 text-2xl">🔒</div>
      {episodeNumber && <p className="mt-3 text-sm text-white/60">Episódio {episodeNumber} é exclusivo para assinantes</p>}
      <p className="mt-2 text-2xl font-extrabold">Assista tudo por {PRICE_SHORT}</p>
      <p className="mt-2 text-sm text-white/80">Sem pagar por episódio, sem moedas. Dramas 100% brasileiros, em português.</p>
      <ul className="mt-4 space-y-1 text-left text-sm text-white/80">
        {COPY.bullets.map((b) => <li key={b}>✓ {b}</li>)}
      </ul>
      <Link href={loggedIn ? "/assinar" : "/entrar?next=/assinar"} className="btn-primary mt-5 w-full">
        Assinar por {PRICE_LABEL}
      </Link>
      <p className="mt-2 text-xs text-white/50">Pagamento seguro pelo Mercado Pago. Cancele quando quiser.</p>
    </div>
  );
}
