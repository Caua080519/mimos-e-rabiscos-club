-- Registro do que foi aplicado no projeto Supabase "mimos-e-rabiscos-club" (migration init_schema_com_rls).
-- Não contém segredos. Serve para recriar o banco do zero, se um dia for preciso.

-- Schema privado para funções auxiliares (não exposto pela API)
create schema if not exists private;
grant usage on schema private to authenticated;

-- Perfil de cada usuário (ligado ao login do Supabase)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- O usuário logado é dono (admin)?
create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin') $$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- Cria o perfil automaticamente quando alguém cria conta
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name',''))
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create table public.addresses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  line text, city text, cep text,
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('mimobox','encantobox','dream-box')),
  status text not null default 'aguardando pagamento' check (status in ('aguardando pagamento','ativo','inadimplente','cancelado')),
  started_at date,
  cancelled_at date,
  pay_method text check (pay_method in ('Pix','Cartão','Boleto')),
  pay_status text not null default 'pendente' check (pay_status in ('pendente','pago','atrasado')),
  last_paid_at date,
  created_at timestamptz not null default now()
);
create index subscriptions_user_id_idx on public.subscriptions (user_id);

create table public.boxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  n int not null check (n >= 1),
  ship_date date,
  status text not null default 'A preparar' check (status in ('A preparar','Em preparação','Pronta para envio','Enviado','Entregue')),
  tracking text,
  created_at timestamptz not null default now(),
  unique (user_id, n)
);

-- Registro OFICIAL dos selos do Passaporte (só donos criam)
create table public.stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  n int not null check (n between 1 and 12),
  stamped_on date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  unique (user_id, n)
);
create index stamps_created_by_idx on public.stamps (created_by);

create table public.passports (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  products text[] not null default '{}',
  image_url text,
  ship_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index themes_only_one_current on public.themes (is_current) where is_current;

-- Segurança por linha (RLS) em TODAS as tabelas
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.boxes enable row level security;
alter table public.stamps enable row level security;
alter table public.passports enable row level security;
alter table public.themes enable row level security;

-- profiles: cada um vê o seu; dono vê todos. Cliente só altera nome e telefone (nunca o cargo).
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (name, phone) on public.profiles to authenticated;

-- addresses: o cliente gerencia o próprio; dono lê todos
create policy addresses_select on public.addresses for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy addresses_insert_own on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy addresses_update_own on public.addresses for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- subscriptions / boxes / stamps / passports: cliente SÓ LÊ os próprios; só dono escreve
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy subscriptions_admin_write on public.subscriptions for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy boxes_select on public.boxes for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy boxes_admin_write on public.boxes for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy stamps_select on public.stamps for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy stamps_admin_write on public.stamps for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy passports_select on public.passports for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy passports_admin_write on public.passports for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- themes: o tema do mês é público; o resto, só dono
create policy themes_public_current on public.themes for select to anon, authenticated
  using (is_current);
create policy themes_admin_all on public.themes for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Visitantes sem login não acessam dados pessoais
revoke all on public.profiles, public.addresses, public.subscriptions, public.boxes, public.stamps, public.passports from anon;
