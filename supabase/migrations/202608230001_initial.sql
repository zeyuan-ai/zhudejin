create extension if not exists pgcrypto;

create type public.listing_status as enum ('active', 'inactive', 'expired');
create type public.rental_type as enum ('整租', '合租');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  district text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  rent integer not null check (rent > 0),
  rental_type public.rental_type not null,
  bedroom_count integer not null check (bedroom_count > 0),
  bedrooms text not null,
  area numeric(7,2) not null check (area > 0),
  image_url text,
  station text not null,
  station_walk_minutes integer not null check (station_walk_minutes >= 0),
  build_year integer,
  highlights jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  description text not null default '',
  source_name text not null,
  source_url text not null,
  source_updated_at timestamptz not null,
  expires_at timestamptz,
  status public.listing_status not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_search_idx on public.listings (status, rent, rental_type, bedroom_count, area, station_walk_minutes);

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code_hash text not null unique,
  expires_at timestamptz not null,
  daily_limit integer not null default 10 check (daily_limit > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.invite_sessions (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.invite_codes(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.route_cache (
  cache_key text primary key,
  provider text not null default 'amap',
  origin jsonb not null,
  destination jsonb not null,
  transport text not null,
  route_options jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index route_cache_expiry_idx on public.route_cache (expires_at);

create table public.search_logs (
  id bigint generated always as identity primary key,
  invite_id uuid references public.invite_codes(id) on delete set null,
  session_id uuid references public.invite_sessions(id) on delete set null,
  filters jsonb not null,
  result_count integer not null,
  duration_ms integer not null,
  cache_hits integer not null default 0,
  created_at timestamptz not null default now()
);
create index search_logs_limits_idx on public.search_logs (session_id, created_at desc);

create table public.feedback (
  id bigint generated always as identity primary key,
  session_id uuid references public.invite_sessions(id) on delete set null,
  helpful boolean not null,
  result_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.route_audits (
  id bigint generated always as identity primary key,
  cache_key text references public.route_cache(cache_key) on delete set null,
  amap_result jsonb not null,
  baidu_result jsonb,
  time_difference_minutes numeric,
  time_difference_ratio numeric,
  transfer_difference integer,
  walk_difference_meters integer,
  is_flagged boolean not null default false,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;
alter table public.invite_codes enable row level security;
alter table public.invite_sessions enable row level security;
alter table public.route_cache enable row level security;
alter table public.search_logs enable row level security;
alter table public.feedback enable row level security;
alter table public.admins enable row level security;
alter table public.route_audits enable row level security;

create policy "admins can read listings" on public.listings for select to authenticated using (exists (select 1 from public.admins where user_id = auth.uid()));
create policy "admins can insert listings" on public.listings for insert to authenticated with check (exists (select 1 from public.admins where user_id = auth.uid()));
create policy "admins can update listings" on public.listings for update to authenticated using (exists (select 1 from public.admins where user_id = auth.uid())) with check (exists (select 1 from public.admins where user_id = auth.uid()));
create policy "admins can delete listings" on public.listings for delete to authenticated using (exists (select 1 from public.admins where user_id = auth.uid()));
create policy "admins can view admin list" on public.admins for select to authenticated using (user_id = auth.uid());

create or replace function public.purge_expired_product_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.route_cache where expires_at < now();
  delete from public.invite_sessions where expires_at < now();
  delete from public.search_logs where created_at < now() - interval '30 days';
end;
$$;

comment on function public.purge_expired_product_data is 'Schedule daily with Supabase Cron after deployment.';
