-- Registro das migrations "endereco_assinatura_e_funcoes_de_admin" e "email_no_perfil" aplicadas no Supabase.
-- Não contém segredos.

-- Endereço completo
alter table public.addresses add column complement text, add column district text, add column state text;

-- Menos permissões soltas: cliente não escreve direto em assinaturas, caixas, selos e passaportes
revoke insert, update, delete on public.subscriptions, public.boxes, public.stamps, public.passports from authenticated, anon;
revoke delete on public.addresses, public.profiles from authenticated;

-- O cliente pode registrar a Box que escolheu (sempre "aguardando pagamento") e trocar de Box enquanto não pagou
grant insert (user_id, plan) on public.subscriptions to authenticated;
grant update (plan) on public.subscriptions to authenticated;
create policy subscriptions_insert_own_pending on public.subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'aguardando pagamento' and pay_status = 'pendente');
create policy subscriptions_update_plan_pending on public.subscriptions for update to authenticated
  using (user_id = (select auth.uid()) and status = 'aguardando pagamento')
  with check (user_id = (select auth.uid()) and status = 'aguardando pagamento');
create unique index subscriptions_one_open_per_user on public.subscriptions (user_id) where status <> 'cancelado';

-- Registrar pagamento: ativa a assinatura, cria o passaporte (código aleatório) e a caixa em aberto
create function public.admin_register_payment(p_user uuid, p_plan text default null, p_method text default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_sub public.subscriptions; v_hex text; v_n int;
begin
  if not private.is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  if p_method is not null and p_method not in ('Pix','Cartão','Boleto') then raise exception 'forma de pagamento inválida'; end if;
  select * into v_sub from public.subscriptions where user_id = p_user and status <> 'cancelado' order by created_at desc limit 1;
  if not found then
    if p_plan is null then raise exception 'informe o plano'; end if;
    insert into public.subscriptions (user_id, plan) values (p_user, p_plan) returning * into v_sub;
  end if;
  update public.subscriptions set
    plan = coalesce(p_plan, plan), status = 'ativo', pay_status = 'pago', last_paid_at = current_date,
    started_at = coalesce(started_at, current_date), pay_method = coalesce(p_method, pay_method)
  where id = v_sub.id;
  v_hex := upper(replace(gen_random_uuid()::text, '-', ''));
  insert into public.passports (user_id, code)
    values (p_user, 'MR-' || substr(v_hex,1,4) || '-' || substr(v_hex,5,4) || '-' || substr(v_hex,9,4) || '-' || substr(v_hex,13,4))
    on conflict (user_id) do nothing;
  if not exists (select 1 from public.boxes where user_id = p_user and status <> 'Entregue') then
    select coalesce(max(n),0) + 1 into v_n from public.boxes where user_id = p_user;
    insert into public.boxes (user_id, n) values (p_user, v_n);
  end if;
end $$;

-- Mudar o andamento de uma caixa. Ao marcar "Entregue", nasce o selo OFICIAL no passaporte.
create function public.admin_set_box_status(p_box uuid, p_status text, p_tracking text default null, p_ship_date date default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_box public.boxes;
begin
  if not private.is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  if p_status not in ('A preparar','Em preparação','Pronta para envio','Enviado','Entregue') then raise exception 'status inválido'; end if;
  update public.boxes set status = p_status, tracking = coalesce(p_tracking, tracking), ship_date = coalesce(p_ship_date, ship_date)
    where id = p_box returning * into v_box;
  if not found then raise exception 'caixa não encontrada'; end if;
  if p_status = 'Entregue' and v_box.n <= 12 then
    insert into public.stamps (user_id, n, stamped_on, created_by) values (v_box.user_id, v_box.n, current_date, (select auth.uid()))
      on conflict (user_id, n) do nothing;
  end if;
end $$;

-- Mudar o status da assinatura (ativo, inadimplente, cancelado)
create function public.admin_set_subscription_status(p_user uuid, p_status text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  if p_status not in ('ativo','inadimplente','cancelado') then raise exception 'status inválido'; end if;
  update public.subscriptions set
    status = p_status,
    pay_status = case when p_status = 'inadimplente' then 'atrasado' else pay_status end,
    cancelled_at = case when p_status = 'cancelado' then current_date else cancelled_at end
  where user_id = p_user and status <> 'cancelado';
  if not found then raise exception 'assinatura não encontrada'; end if;
end $$;

-- Escolher o tema do mês (só um de cada vez)
create function public.admin_set_current_theme(p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  update public.themes set is_current = false where is_current;
  if p_id is not null then update public.themes set is_current = true where id = p_id; end if;
end $$;

revoke execute on function public.admin_register_payment(uuid, text, text) from public, anon;
revoke execute on function public.admin_set_box_status(uuid, text, text, date) from public, anon;
revoke execute on function public.admin_set_subscription_status(uuid, text) from public, anon;
revoke execute on function public.admin_set_current_theme(uuid) from public, anon;
grant execute on function public.admin_register_payment(uuid, text, text) to authenticated;
grant execute on function public.admin_set_box_status(uuid, text, text, date) to authenticated;
grant execute on function public.admin_set_subscription_status(uuid, text) to authenticated;
grant execute on function public.admin_set_current_theme(uuid) to authenticated;

-- E-mail no perfil (o painel dos donos precisa dele)
alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email) values (new.id, coalesce(new.raw_user_meta_data->>'name',''), new.email)
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

-- Para tornar alguém dono (rode no SQL Editor do Supabase, nunca pelo site):
--   update public.profiles set role = 'admin' where email = 'EMAIL_DO_DONO';
