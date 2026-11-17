import { isDemoMode } from "@/lib/env";

export default function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="bg-brand-gold px-4 py-1.5 text-center text-xs font-medium text-black">
      Modo demonstração — conecte o Supabase para ativar cadastro, assinaturas e o painel admin.
    </div>
  );
}
