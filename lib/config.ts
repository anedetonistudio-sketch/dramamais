// ============================================================
// Drama+ — configuração central (preço, textos de posicionamento)
// Edite aqui para mudar plano, preço e mensagens do site inteiro.
// ============================================================

export const SITE = {
  name: "Drama+",
  domain: "dramamais.com.br",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://dramamais.com.br",
  tagline: "Microdramas 100% brasileiros",
  description:
    "Drama+ é o streaming de microdramas 100% brasileiro: novelas verticais em português, feitas no Brasil. Assine por R$ 25/mês e assista tudo — sem pagar por episódio, sem moedas.",
};

/** Plano único. Valor em reais. */
export const PLAN = {
  id: "mensal",
  name: "Mensal",
  price: 25.0,
  currency: "BRL",
  frequency: 1,
  frequencyType: "months" as const,
  reason: "Drama+ — Assinatura Mensal",
};

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const PRICE_LABEL = `${formatBRL(PLAN.price)}/mês`; // "R$ 25,00/mês"
export const PRICE_SHORT = "R$ 25/mês";

/** Quantos episódios grátis por série (padrão quando a série não define). */
export const DEFAULT_FREE_EPISODES = 5;

/** Textos de posicionamento usados no hero, paywall e rodapé. */
export const COPY = {
  heroKicker: "100% brasileiro",
  heroTitle: "Dramas em português, feitos no Brasil.",
  heroSubtitle: `Assine por ${PRICE_SHORT} e assista tudo — sem pagar por episódio, sem moedas.`,
  priceCompare:
    "Enquanto os apps gringos cobram por episódio e vendem moedas, no Drama+ é um preço só: você assina e assiste tudo.",
  bullets: [
    "Todas as séries e todos os episódios liberados",
    "Sem moedas, sem pagar por episódio, sem surpresa na fatura",
    "Histórias brasileiras, em português, com elenco nacional",
    "Cancele quando quiser, direto pelo Mercado Pago",
  ],
  footer:
    "Drama+ é 100% brasileiro: microdramas em português, feitos no Brasil. Um preço justo — R$ 25/mês para assistir tudo, sem moedas e sem pagar por episódio.",
};
