export type Series = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genre: string;
  cover_url: string | null;
  free_episodes: number;
  featured: boolean;
  published: boolean;
  episode_count: number;
  created_at?: string;
};

export type Episode = {
  id: string;
  series_id: string;
  number: number;
  title: string;
  video_path: string | null;
  duration_seconds: number | null;
};

/** Episódio como o cliente vê (sem caminho do vídeo). */
export type PublicEpisode = {
  id: string;
  number: number;
  title: string;
  free: boolean;
};
