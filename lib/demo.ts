// Séries de demonstração — usadas quando o Supabase não está configurado.
import type { Episode, Series } from "./types";

type DemoSeries = Series & { video: string; titles: string[] };

const mk = (
  id: string, slug: string, title: string, genre: string, synopsis: string,
  free: number, featured: boolean, video: string, titles: string[]
): DemoSeries => ({
  id, slug, title, genre, synopsis, free_episodes: free, featured, published: true,
  cover_url: `/demo/${slug}.jpg`, episode_count: titles.length, video, titles,
});

export const DEMO_SERIES: DemoSeries[] = [
  mk("demo-1", "amor-de-aluguel", "Amor de Aluguel", "Romance",
    "Para salvar a padaria da família em Curitiba, Júlia aceita fingir ser noiva do herdeiro mais arrogante da cidade por 30 dias. O contrato tinha uma regra: não se apaixonar.",
    5, true, "/demo/demo-1.mp4",
    ["O contrato", "Primeiro jantar", "A sogra desconfia", "O beijo ensaiado", "Ciúmes", "A cláusula secreta", "A verdade vem à tona", "Recomeço"]),
  mk("demo-2", "a-herdeira-esquecida", "A Herdeira Esquecida", "Drama",
    "Criada como faxineira na mansão dos Albuquerque, Marina descobre no dia do enterro do patriarca que ela é a verdadeira herdeira de tudo.",
    3, false, "/demo/demo-2.mp4",
    ["O testamento", "O segredo da governanta", "Exame de DNA", "A primeira reunião", "Traição", "Herança"]),
  mk("demo-3", "vinganca-no-sertao", "Vingança no Sertão", "Suspense",
    "Dez anos depois de ser expulso da fazenda, Tonho volta ao sertão com outro nome, muito dinheiro e um único plano: fazer o coronel pagar.",
    5, false, "/demo/demo-3.mp4",
    ["A volta", "O leilão", "Sangue velho", "A filha do coronel", "Emboscada", "O nome verdadeiro", "Acerto de contas"]),
];

export const demoEpisodes = (seriesId: string): Episode[] => {
  const s = DEMO_SERIES.find((x) => x.id === seriesId);
  if (!s) return [];
  return s.titles.map((t, i) => ({
    id: `${s.id}-ep${i + 1}`, series_id: s.id, number: i + 1, title: t,
    video_path: s.video, duration_seconds: 10,
  }));
};

export const findDemoEpisode = (episodeId: string) => {
  for (const s of DEMO_SERIES) {
    const ep = demoEpisodes(s.id).find((e) => e.id === episodeId);
    if (ep) return { series: s, episode: ep };
  }
  return null;
};

export const stripDemo = ({ video, titles, ...s }: DemoSeries): Series => s;
