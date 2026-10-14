-- Calendario Payless · esquema de Supabase
-- Ejecutar una vez en el SQL Editor del proyecto (o con `psql`). Es idempotente.
--
-- Modelo: la app guarda documentos JSON por colección (posts, medios, comentarios, salud…),
-- igual que en Claude. Cada fila de `docs` es un documento.
-- Acceso: solo entran los correos de `miembros`. `salud` y `direccion` solo las ve Inside.

-- ---------------------------------------------------------------- miembros
create table if not exists public.miembros (
  id      text primary key,               -- id que usa la app (el de Claude si la persona ya tenía uno)
  email   text unique,                    -- correo de Google con el que entra; null = persona histórica sin acceso
  nombre  text not null,
  rol     text not null check (rol in ('inside','cliente')),
  dueno   boolean not null default false, -- dueña del calendario (Inside)
  activo  boolean not null default true,
  creado  timestamptz not null default now()
);
alter table public.miembros enable row level security;
-- Sin políticas: nadie la lee directo; la app usa las funciones `yo()` y `perfiles()`.

create or replace function public.mi_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where lower(email) = mi_email() and activo)
$$;

create or replace function public.es_inside() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where lower(email) = mi_email() and activo and rol = 'inside')
$$;

-- Quién soy: la fila de miembros de la persona conectada (o nada si no tiene acceso).
create or replace function public.yo() returns table (id text, nombre text, rol text, dueno boolean, email text)
language sql stable security definer set search_path = public as $$
  select m.id, m.nombre, m.rol, m.dueno, m.email from miembros m
  where lower(m.email) = mi_email() and m.activo limit 1
$$;

-- Nombres para mostrar (autores de comentarios, etc.). Solo para miembros; nunca devuelve correos.
create or replace function public.perfiles(ids text[]) returns table (id text, nombre text, rol text)
language sql stable security definer set search_path = public as $$
  select m.id, m.nombre, m.rol from miembros m
  where es_miembro() and m.id = any(ids)
$$;

-- ---------------------------------------------------------------- docs
create table if not exists public.docs (
  coleccion   text not null,
  id          text not null,
  data        jsonb not null default '{}'::jsonb,
  version     integer not null default 1,
  actualizado timestamptz not null default now(),
  primary key (coleccion, id)
);
alter table public.docs replica identity full;

create or replace function public.docs_version() returns trigger
language plpgsql as $$
begin
  new.version := old.version + 1;
  new.actualizado := now();
  return new;
end $$;
drop trigger if exists docs_version on public.docs;
create trigger docs_version before update on public.docs
  for each row execute function public.docs_version();

-- Colecciones que solo ve Inside.
create or replace function public.coleccion_privada(c text) returns boolean
language sql immutable as $$ select c in ('salud', 'direccion') $$;

alter table public.docs enable row level security;
drop policy if exists docs_leer on public.docs;
drop policy if exists docs_crear on public.docs;
drop policy if exists docs_cambiar on public.docs;
drop policy if exists docs_borrar on public.docs;
create policy docs_leer on public.docs for select to authenticated
  using (es_miembro() and (not coleccion_privada(coleccion) or es_inside()));
create policy docs_crear on public.docs for insert to authenticated
  with check (es_miembro() and (not coleccion_privada(coleccion) or es_inside()));
create policy docs_cambiar on public.docs for update to authenticated
  using (es_miembro() and (not coleccion_privada(coleccion) or es_inside()))
  with check (es_miembro() and (not coleccion_privada(coleccion) or es_inside()));
create policy docs_borrar on public.docs for delete to authenticated
  using (es_miembro() and (not coleccion_privada(coleccion) or es_inside()));

-- Actualización parcial: mezcla los campos de `patch` en el documento.
-- Un campo con valor {"__delete__": true} se borra. Respeta las políticas de arriba.
create or replace function public.doc_update(p_coleccion text, p_id text, p_patch jsonb) returns integer
language plpgsql as $$
declare v integer;
begin
  update docs set data = (data || coalesce((
      select jsonb_object_agg(k, val) from jsonb_each(p_patch) as e(k, val)
      where not (jsonb_typeof(val) = 'object' and val ? '__delete__')), '{}'::jsonb))
    - coalesce((
      select array_agg(k) from jsonb_each(p_patch) as e(k, val)
      where jsonb_typeof(val) = 'object' and val ? '__delete__'), '{}'::text[])
  where coleccion = p_coleccion and id = p_id
  returning version into v;
  if not found then
    raise exception 'documento % / % no existe', p_coleccion, p_id using errcode = 'P0002';
  end if;
  return v;
end $$;

-- Tiempo real: la app escucha los cambios de `docs`.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;

-- ---------------------------------------------------------------- archivos
-- Bucket privado. Lo lee y escribe solo el servidor (con la clave de servicio);
-- el navegador pide los archivos a /_blob/<id>, que comprueba que la persona sea miembro.
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('artes', 'artes', false, 52428800)
    on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;
  end if;
end $$;
