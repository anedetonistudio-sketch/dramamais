-- =====================================================================
-- Drama+ — schema do Supabase
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez).
-- É idempotente: pode rodar de novo sem quebrar.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- PROFILES (1:1 com auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- cria o profile automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- helper: o usuário atual é admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- SERIES
-- ---------------------------------------------------------------------
create table if not exists public.series (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  synopsis       text not null default '',
  genre          text not null default 'Drama',
  cover_url      text,
  free_episodes  int  not null default 5 check (free_episodes >= 0),
  featured       boolean not null default false,
  published      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- EPISODES
-- video_path = caminho do arquivo no bucket PRIVADO "episodes"
-- ---------------------------------------------------------------------
create table if not exists public.episodes (
  id                uuid primary key default gen_random_uuid(),
  series_id         uuid not null references public.series(id) on delete cascade,
  number            int  not null check (number > 0),
  title             text not null default '',
  video_path        text,
  duration_seconds  int,
  created_at        timestamptz not null default now(),
  unique (series_id, number)
);
create index if not exists episodes_series_idx on public.episodes(series_id, number);

-- ---------------------------------------------------------------------
-- SUBSCRIPTIONS (escrita só pelo servidor via service role / webhook)
-- status: pending | active | paused | cancelled | inactive
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  mp_preapproval_id   text unique,
  status              text not null default 'pending',
  plan                text default 'mensal',
  amount              numeric(10,2),
  current_period_end  timestamptz,
  raw                 jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id, updated_at desc);

-- helper: o usuário tem assinatura ativa? (só responde sobre si mesmo, ou admin)
create or replace function public.has_active_subscription(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid and status = 'active'
      and (uid = auth.uid() or public.is_admin())
  );
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.series        enable row level security;
alter table public.episodes      enable row level security;
alter table public.subscriptions enable row level security;

-- profiles: cada um lê o seu; admin lê todos. Usuário só pode mudar o "name".
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (name) on public.profiles to authenticated;

-- series: público lê as publicadas; admin faz tudo
drop policy if exists "series_public_read" on public.series;
create policy "series_public_read" on public.series
  for select using (published or public.is_admin());
drop policy if exists "series_admin_all" on public.series;
create policy "series_admin_all" on public.series
  for all using (public.is_admin()) with check (public.is_admin());

-- episodes: metadados públicos (o vídeo fica em bucket privado); admin faz tudo
drop policy if exists "episodes_public_read" on public.episodes;
create policy "episodes_public_read" on public.episodes
  for select using (
    exists (select 1 from public.series s where s.id = series_id and (s.published or public.is_admin()))
  );
drop policy if exists "episodes_admin_all" on public.episodes;
create policy "episodes_admin_all" on public.episodes
  for all using (public.is_admin()) with check (public.is_admin());

-- subscriptions: usuário só lê as próprias. Nenhuma escrita pelo cliente
-- (o webhook usa SUPABASE_SERVICE_ROLE_KEY, que ignora RLS).
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- STORAGE
--   covers   -> PÚBLICO (capas)
--   episodes -> PRIVADO (vídeos; servidos só por URL assinada do servidor)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit)
values ('episodes', 'episodes', false, 524288000) -- 500 MB por arquivo
on conflict (id) do update set public = false;

drop policy if exists "covers_public_read" on storage.objects;
create policy "covers_public_read" on storage.objects
  for select using (bucket_id = 'covers');
drop policy if exists "covers_admin_write" on storage.objects;
create policy "covers_admin_write" on storage.objects
  for insert with check (bucket_id = 'covers' and public.is_admin());
drop policy if exists "covers_admin_update" on storage.objects;
create policy "covers_admin_update" on storage.objects
  for update using (bucket_id = 'covers' and public.is_admin());
drop policy if exists "covers_admin_delete" on storage.objects;
create policy "covers_admin_delete" on storage.objects
  for delete using (bucket_id = 'covers' and public.is_admin());

-- episodes: só admin envia/gerencia. NINGUÉM lê direto: o servidor gera
-- URL assinada (service role) depois de checar episódio grátis/assinatura.
drop policy if exists "episodes_admin_insert" on storage.objects;
create policy "episodes_admin_insert" on storage.objects
  for insert with check (bucket_id = 'episodes' and public.is_admin());
drop policy if exists "episodes_admin_select" on storage.objects;
create policy "episodes_admin_select" on storage.objects
  for select using (bucket_id = 'episodes' and public.is_admin());
drop policy if exists "episodes_admin_update" on storage.objects;
create policy "episodes_admin_update" on storage.objects
  for update using (bucket_id = 'episodes' and public.is_admin());
drop policy if exists "episodes_admin_delete" on storage.objects;
create policy "episodes_admin_delete" on storage.objects
  for delete using (bucket_id = 'episodes' and public.is_admin());

-- ---------------------------------------------------------------------
-- Tornar alguém admin (rode depois de criar sua conta no site):
--   update public.profiles set is_admin = true where email = 'seu@email.com';
-- ---------------------------------------------------------------------
