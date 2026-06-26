-- Mawal NT Site KML Viewer — initial schema
-- Run in Supabase SQL Editor or via supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------------
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  folder_name text not null,
  site_number int,
  lat double precision,
  lng double precision,
  region text,
  land_council text,
  existing_solar_kw numeric,
  target_solar_kwac numeric,
  existing_bess_kwh numeric,
  target_bess_kwh numeric,
  additional_solar_kwac numeric,
  additional_bess_kwh numeric,
  traffic_light text check (traffic_light in ('GREEN', 'AMBER', 'RED')),
  imagery_date text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sites_traffic_light_idx on public.sites (traffic_light);
create index if not exists sites_name_idx on public.sites (name);

-- ---------------------------------------------------------------------------
-- site_kml_files
-- ---------------------------------------------------------------------------
create table if not exists public.site_kml_files (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  is_primary boolean not null default false,
  is_additional_area boolean not null default false,
  created_at timestamptz not null default now(),
  unique (site_id, file_name)
);

create index if not exists site_kml_files_site_id_idx on public.site_kml_files (site_id);

-- ---------------------------------------------------------------------------
-- site_layers (parsed polygons from KML)
-- ---------------------------------------------------------------------------
create table if not exists public.site_layers (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  kml_file_id uuid not null references public.site_kml_files (id) on delete cascade,
  layer_name text not null,
  layer_type text not null check (
    layer_type in (
      'fence',
      'existing_solar',
      'proposed_solar',
      'bess',
      'generators',
      'storage',
      'tbc',
      'purple',
      'cyan',
      'other'
    )
  ),
  geometry_geojson jsonb not null,
  area_m2 numeric not null,
  area_ha numeric not null,
  color_hex text not null default '#999999',
  kml_style_raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_layers_site_id_idx on public.site_layers (site_id);
create index if not exists site_layers_layer_type_idx on public.site_layers (layer_type);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sites_set_updated_at on public.sites;
create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket (run once; may need dashboard if policy fails)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kml-files', 'kml-files', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.sites enable row level security;
alter table public.site_kml_files enable row level security;
alter table public.site_layers enable row level security;

-- Authenticated users can read all site data (internal client viewer)
create policy "sites_select_authenticated"
  on public.sites for select
  to authenticated
  using (true);

create policy "site_kml_files_select_authenticated"
  on public.site_kml_files for select
  to authenticated
  using (true);

create policy "site_layers_select_authenticated"
  on public.site_layers for select
  to authenticated
  using (true);

-- Service role bypasses RLS; ingest script uses service role key.

-- Storage: authenticated read for KML downloads
create policy "kml_files_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'kml-files');
