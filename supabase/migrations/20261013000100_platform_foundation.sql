-- Apply after the original Bolt migration. Cash operation remains disabled.
begin;
-- Remove prototype public write policies while retaining public catalog reads.
do $$
declare t text; p text;
begin
  foreach t in array array['providers','game_categories','games','promotions'] loop
    foreach p in array array['insert','update','delete'] loop
      execute format('drop policy if exists %I on public.%I','anon_'||p||'_'||t,t);
    end loop;
    execute format('revoke insert, update, delete on public.%I from anon, authenticated',t);
  end loop;
end $$;
-- Retain catalog visibility when installing the account and wallet schema.

create table public.platform_settings (
  id boolean primary key default true check(id),
  real_money_enabled boolean not null default false,
  operator_name text,
  license_authority text,
  license_reference text,
  allowed_countries text[] not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.platform_settings(id) values(true);
alter table public.platform_settings enable row level security;
create policy public_platform_read on public.platform_settings for select to anon,authenticated using(true);

create table public.player_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null default 'Player' check(length(display_name) between 1 and 40),
  date_of_birth date,
  country text not null default '',
  kyc_status text not null default 'pending' check(kyc_status in ('pending','verified','rejected')),
  account_status text not null default 'active' check(account_status in ('active','suspended','closed')),
  excluded_until timestamptz,
  daily_loss_limit_minor bigint not null default 10000 check(daily_loss_limit_minor between 1 and 100000000),
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.player_profiles enable row level security;
create policy own_profile_read on public.player_profiles for select to authenticated using(id=auth.uid());

create table public.wallets (
  user_id uuid primary key references public.player_profiles(id) on delete restrict,
  currency text not null default 'USD' check(currency='USD'),
  balance_minor bigint not null default 0 check(balance_minor between 0 and 9000000000000),
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
create policy own_wallet_read on public.wallets for select to authenticated using(user_id=auth.uid());

create table public.provider_integrations (
  slug text primary key,
  display_name text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.provider_integrations enable row level security;

create table public.provider_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.player_profiles(id),
  provider_slug text not null references public.provider_integrations(slug),
  game_id text not null,
  currency text not null check(currency='USD'),
  status text not null default 'active' check(status in ('active','closed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.provider_sessions enable row level security;
create policy own_session_read on public.provider_sessions for select to authenticated using(user_id=auth.uid());

create table public.provider_rounds (
  session_id uuid not null references public.provider_sessions(id),
  round_id text not null check(length(round_id) between 1 and 200),
  stake_minor bigint not null check(stake_minor between 1 and 100000000),
  return_minor bigint not null default 0 check(return_minor between 0 and 9000000000000),
  state text not null default 'open' check(state in ('open','settled','refunded')),
  created_at timestamptz not null default now(),
  primary key(session_id,round_id)
);
alter table public.provider_rounds enable row level security;

create table public.wallet_events (
  id uuid primary key default gen_random_uuid(),
  provider_slug text not null references public.provider_integrations(slug),
  event_id text not null check(length(event_id) between 1 and 200),
  user_id uuid not null references public.player_profiles(id),
  session_id uuid not null references public.provider_sessions(id),
  round_id text not null,
  kind text not null check(kind in ('debit','credit','refund')),
  amount_minor bigint not null check(amount_minor between 0 and 9000000000000),
  delta_minor bigint not null,
  balance_after_minor bigint not null,
  currency text not null check(currency='USD'),
  created_at timestamptz not null default now(),
  unique(provider_slug,event_id),
  foreign key(session_id,round_id) references public.provider_rounds(session_id,round_id)
);
alter table public.wallet_events enable row level security;
create policy own_events_read on public.wallet_events for select to authenticated using(user_id=auth.uid());
create index provider_sessions_user on public.provider_sessions(user_id);
create index wallet_events_user_time on public.wallet_events(user_id,created_at desc);
create index provider_rounds_day on public.provider_rounds(created_at);
-- Browser users get SELECT only. All account/ledger writes are trusted-server actions.
revoke all on public.player_profiles,public.wallets,public.provider_integrations,public.provider_sessions,public.provider_rounds,public.wallet_events,public.platform_settings from anon,authenticated;
grant select on public.platform_settings to anon,authenticated;
grant select on public.player_profiles,public.wallets,public.provider_sessions,public.wallet_events to authenticated;

create function public.provision_player() returns trigger
language plpgsql security definer set search_path='' as $$
declare birthday date;
begin
  birthday := nullif(new.raw_user_meta_data->>'date_of_birth','')::date;
  if birthday is null or birthday > (current_date - interval '18 years')::date then
    raise exception 'Adult date of birth is required';
  end if;
  if coalesce(new.raw_user_meta_data->>'terms_version','') <> 'prelaunch-v1' then
    raise exception 'Terms acceptance required';
  end if;
  insert into public.player_profiles(id,display_name,date_of_birth,country,terms_version,terms_accepted_at)
  values(new.id,left(coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'),''),'Player'),40),birthday,
    coalesce(new.raw_user_meta_data->>'country',''),'prelaunch-v1',now());
  insert into public.wallets(user_id) values(new.id);
  return new;
end $$;
create trigger on_spindra_user_created after insert on auth.users for each row execute function public.provision_player();
-- Existing users are pending verification; their editable auth metadata is not trusted.
insert into public.player_profiles(id) select id from auth.users on conflict do nothing;
insert into public.wallets(user_id) select id from public.player_profiles on conflict do nothing;
revoke all on function public.provision_player() from public,anon,authenticated;

create function public.lower_loss_limit(p_limit bigint) returns void
language plpgsql security definer set search_path='' as $$
declare old_limit bigint;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select daily_loss_limit_minor into old_limit from public.player_profiles where id=auth.uid() for update;
  if old_limit is null or p_limit is null or p_limit<1 or p_limit>old_limit then raise exception 'Only a lower positive limit is allowed'; end if;
  update public.player_profiles set daily_loss_limit_minor=p_limit where id=auth.uid();
end $$;
create function public.self_exclude() returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  perform 1 from public.player_profiles where id=auth.uid() for update;
  update public.player_profiles set excluded_until=greatest(coalesce(excluded_until,now()),now()+interval '30 days') where id=auth.uid();
  update public.provider_sessions set status='closed' where user_id=auth.uid();
end $$;
revoke all on function public.lower_loss_limit(bigint),public.self_exclude() from public,anon;
grant execute on function public.lower_loss_limit(bigint),public.self_exclude() to authenticated;

-- Normalized single-debit/single-settlement adapter contract. No multi-bet rounds.
-- Idempotency is provider-scoped and validates the full payload on retries.
create function public.provider_wallet_event(
  p_provider text,p_event text,p_session uuid,p_round text,p_kind text,p_amount bigint,p_currency text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.provider_sessions; profile public.player_profiles; w public.wallets;
  prior public.wallet_events; r public.provider_rounds; delta bigint; next_balance bigint; daily_loss bigint;
begin
  if p_kind is null or p_kind not in ('debit','credit','refund') or p_amount is null or p_amount<0 or p_amount>9000000000000 or p_currency is distinct from 'USD' then
    raise exception 'Invalid wallet event';
  end if;
  select * into s from public.provider_sessions where id=p_session;
  if s.id is null or s.provider_slug is distinct from p_provider or s.currency is distinct from p_currency then raise exception 'Invalid provider session'; end if;
  -- Same lock order as exclusions; serializes every transaction for this wallet.
  select * into profile from public.player_profiles where id=s.user_id for update;
  select * into s from public.provider_sessions where id=p_session for update;
  select * into w from public.wallets where user_id=s.user_id for update;
  if w.user_id is null then raise exception 'Wallet missing'; end if;
  select * into prior from public.wallet_events where provider_slug=p_provider and event_id=p_event;
  if prior.id is not null then
    if prior.session_id is distinct from p_session or prior.round_id is distinct from p_round or prior.kind is distinct from p_kind or prior.amount_minor is distinct from p_amount or prior.currency is distinct from p_currency then raise exception 'Idempotency payload conflict'; end if;
    return jsonb_build_object('event_id',prior.event_id,'balance_minor',prior.balance_after_minor,'currency',prior.currency,'replayed',true);
  end if;
  select * into r from public.provider_rounds where session_id=p_session and round_id=p_round for update;
  if p_kind='debit' then
    if not exists(select 1 from public.platform_settings where id=true and real_money_enabled and operator_name is not null and license_authority is not null and license_reference is not null and profile.country=any(allowed_countries)) then raise exception 'Cash operation disabled or country unavailable'; end if;
    if not exists(select 1 from public.provider_integrations where slug=p_provider and enabled) then raise exception 'Provider disabled'; end if;
    if profile.kyc_status<>'verified' or profile.account_status<>'active' or profile.date_of_birth is null or profile.date_of_birth>(current_date-interval '18 years')::date or profile.excluded_until>now() then raise exception 'Player is not eligible'; end if;
    if not exists(select 1 from auth.users where id=s.user_id and email_confirmed_at is not null) then raise exception 'Email not confirmed'; end if;
    if s.status<>'active' or s.expires_at<=now() then raise exception 'Session closed or expired'; end if;
    if p_amount<1 or p_amount>100000000 or r.session_id is not null then raise exception 'Invalid or duplicate round debit'; end if;
    -- Attribute returns to the original wager day, including open-round exposure.
    -- Late settlement of yesterday's win cannot extend today's loss budget.
    select greatest(0,coalesce(sum(pr.stake_minor-pr.return_minor),0)) into daily_loss
      from public.provider_rounds pr join public.provider_sessions ps on ps.id=pr.session_id
      where ps.user_id=s.user_id and pr.created_at >= (date_trunc('day',now() at time zone 'UTC') at time zone 'UTC');
    if daily_loss+p_amount>profile.daily_loss_limit_minor then raise exception 'Daily loss limit exceeded'; end if;
    delta := -p_amount;
    insert into public.provider_rounds(session_id,round_id,stake_minor) values(p_session,p_round,p_amount);
  else
    -- Existing bets may settle after exclusion, shutdown, or session expiry.
    if r.session_id is null or r.state<>'open' then raise exception 'Round missing or already finalized'; end if;
    if p_kind='refund' and p_amount<>r.stake_minor then raise exception 'Refund must equal original stake'; end if;
    delta := p_amount;
    update public.provider_rounds set return_minor=p_amount,state=case when p_kind='refund' then 'refunded' else 'settled' end where session_id=p_session and round_id=p_round;
  end if;
  next_balance := w.balance_minor+delta;
  if next_balance<0 or next_balance>9000000000000 then raise exception 'Insufficient funds or balance limit'; end if;
  update public.wallets set balance_minor=next_balance,updated_at=now() where user_id=s.user_id;
  insert into public.wallet_events(provider_slug,event_id,user_id,session_id,round_id,kind,amount_minor,delta_minor,balance_after_minor,currency)
    values(p_provider,p_event,s.user_id,p_session,p_round,p_kind,p_amount,delta,next_balance,p_currency);
  return jsonb_build_object('event_id',p_event,'balance_minor',next_balance,'currency',p_currency,'replayed',false);
end $$;
revoke all on function public.provider_wallet_event(text,text,uuid,text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.provider_wallet_event(text,text,uuid,text,text,bigint,text) to service_role;
commit;
