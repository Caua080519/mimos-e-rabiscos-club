-- Registro das migrations "perfil_apelido_foto" e "donos_principais" aplicadas no Supabase. Não contém segredos.

-- ===== Apelido e foto de perfil =====
alter table public.profiles add column display_name text check (display_name is null or char_length(display_name) <= 40);
alter table public.profiles add column avatar_path text;
alter table public.profiles add constraint profiles_avatar_path_own_folder check (avatar_path is null or avatar_path like id::text || '/%');
grant update (name, phone, display_name, avatar_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ===== Donos principais =====
-- Cargos: customer (cliente), admin (dono) e owner (dono principal). Só o dono principal muda cargos.
do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.profiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%customer%'
  loop execute format('alter table public.profiles drop constraint %I', c); end loop;
end $$;
alter table public.profiles add constraint profiles_role_check check (role in ('customer','admin','owner'));

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','owner')) $$;

create function private.is_owner() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'owner') $$;
revoke all on function private.is_owner() from public, anon;
grant execute on function private.is_owner() to authenticated;

create table public.role_log (
  id uuid primary key default gen_random_uuid(),
  changed_by uuid references auth.users(id) on delete set null,
  target uuid references auth.users(id) on delete cascade,
  old_role text,
  new_role text,
  changed_at timestamptz not null default now()
);
create index role_log_changed_by_idx on public.role_log (changed_by);
create index role_log_target_idx on public.role_log (target);
alter table public.role_log enable row level security;
revoke all on public.role_log from anon, authenticated;
grant select on public.role_log to authenticated;
create policy role_log_owner_select on public.role_log for select to authenticated using ((select private.is_owner()));

-- No máximo 3 donos principais e sempre pelo menos 1.
create function public.owner_set_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_old text; v_owners int;
begin
  if not private.is_owner() then raise exception 'Só dono principal pode mudar cargos.'; end if;
  if p_role not in ('customer','admin','owner') then raise exception 'Cargo inválido.'; end if;
  perform pg_advisory_xact_lock(7342);
  select role into v_old from public.profiles where id = p_user;
  if not found then raise exception 'Conta não encontrada.'; end if;
  if v_old = p_role then return; end if;
  select count(*) into v_owners from public.profiles where role = 'owner';
  if p_role = 'owner' and v_owners >= 3 then raise exception 'Já existem 3 donos principais. Tire o cargo de um deles antes.'; end if;
  if v_old = 'owner' and v_owners <= 1 then raise exception 'Precisa existir pelo menos 1 dono principal.'; end if;
  update public.profiles set role = p_role where id = p_user;
  insert into public.role_log (changed_by, target, old_role, new_role) values ((select auth.uid()), p_user, v_old, p_role);
end $$;
revoke execute on function public.owner_set_role(uuid, text) from public, anon;
grant execute on function public.owner_set_role(uuid, text) to authenticated;

-- A primeira dona principal é definida uma vez, pelo SQL Editor (nunca pelo site):
--   update public.profiles set role = 'owner' where email = 'EMAIL_DO_DONO_PRINCIPAL';
