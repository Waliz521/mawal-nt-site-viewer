-- Allow browser (anon key) to read site data for internal MVP viewer.
-- Safe to re-run.

drop policy if exists "sites_select_anon" on public.sites;
create policy "sites_select_anon"
  on public.sites for select
  to anon
  using (true);

drop policy if exists "site_kml_files_select_anon" on public.site_kml_files;
create policy "site_kml_files_select_anon"
  on public.site_kml_files for select
  to anon
  using (true);

drop policy if exists "site_layers_select_anon" on public.site_layers;
create policy "site_layers_select_anon"
  on public.site_layers for select
  to anon
  using (true);
