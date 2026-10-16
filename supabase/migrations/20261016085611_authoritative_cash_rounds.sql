-- Server-authorized originals. No private deck or unplayed result is readable by browser roles.
begin;
create table public.cash_game_config(id boolean primary key default true check(id),enabled boolean not null default false,model text not null default 'spindra-cash-v1',max_stake_minor bigint not null default 20000 check(max_stake_minor between 100 and 1000000),blocked_countries text[] not null default array['AU','KM','FR','NL','ES','GB','US']);
insert into public.cash_game_config(id) values(true);
alter table public.cash_game_config enable row level security;
create policy cash_game_config_read on public.cash_game_config for select to authenticated using(true);
revoke all on public.cash_game_config from public,anon,authenticated;grant select on public.cash_game_config to authenticated;grant all on public.cash_game_config to service_role;
create table public.cash_game_rounds(id uuid primary key,user_id uuid not null references public.player_profiles(id),game text not null,model text not null,revision integer not null default 0,state text not null check(state in ('open','settled')),stake_minor bigint not null check(stake_minor>0),returned_minor bigint not null default 0 check(returned_minor>=0),private_state jsonb not null,public_state jsonb not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),expires_at timestamptz not null default(now()+interval '15 minutes'));
create unique index one_open_cash_round on public.cash_game_rounds(user_id) where state='open';
create index cash_rounds_user_time on public.cash_game_rounds(user_id,created_at);
create index cash_rounds_expiry on public.cash_game_rounds(expires_at) where state='open';
alter table public.cash_game_rounds enable row level security;
revoke all on public.cash_game_rounds from public,anon,authenticated;grant all on public.cash_game_rounds to service_role;
create table public.cash_game_commands(user_id uuid not null references public.player_profiles(id),request_key uuid not null,round_id uuid not null references public.cash_game_rounds(id),request jsonb not null,response jsonb not null,created_at timestamptz not null default now(),primary key(user_id,request_key));
alter table public.cash_game_commands enable row level security;
revoke all on public.cash_game_commands from public,anon,authenticated;grant all on public.cash_game_commands to service_role;
alter table public.cash_events drop constraint cash_events_kind_check;
alter table public.cash_events add constraint cash_events_kind_check check(kind in ('deposit','withdrawal_reserve','withdrawal_refund','admin_adjustment','game_stake','game_return'));
create function public.cash_game_eligibility(p_user uuid) returns text language plpgsql security definer set search_path='' as $$
declare p public.player_profiles;s public.platform_settings;c public.cash_game_config;
begin
 select * into p from public.player_profiles where id=p_user;select * into s from public.platform_settings where id;select * into c from public.cash_game_config where id;
 if not coalesce(s.real_money_enabled,false) or not coalesce(c.enabled,false) or length(btrim(coalesce(s.operator_name,'')))=0 or length(btrim(coalesce(s.license_authority,'')))=0 or length(btrim(coalesce(s.license_reference,'')))=0 then return 'Cash wagering is not enabled by the operator';end if;
 if p.id is null or p.account_status<>'active' or p.kyc_status<>'verified' or p.date_of_birth is null or p.date_of_birth>(current_date-interval '18 years')::date then return 'Verified adult account required';end if;
 if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then return 'Confirm your email first';end if;
 if p.excluded_until>now() then return 'Account is self-excluded';end if;
 if p.country=any(c.blocked_countries) or not(p.country=any(s.allowed_countries)) or coalesce(array_length(s.allowed_countries,1),0)=0 then return 'Cash play is unavailable in your verified country';end if;
 return null;
end $$;
-- Atomic command commit: account -> wallet -> round is the lock order used by payments and exclusions.
create function public.commit_cash_game(p_user uuid,p_key uuid,p_round uuid,p_revision integer,p_game text,p_request jsonb,p_private jsonb,p_public jsonb,p_stake bigint,p_return bigint,p_done boolean,p_geo_country text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.player_profiles;w public.wallets;r public.cash_game_rounds;prior public.cash_game_commands;c public.cash_game_config;reason text;extra bigint;paid bigint;loss bigint;answer jsonb;
begin
 select * into p from public.player_profiles where id=p_user for update;select * into w from public.wallets where user_id=p_user for update;
 if w.user_id is null then raise exception 'Wallet missing';end if;
 select * into prior from public.cash_game_commands where user_id=p_user and request_key=p_key;
 if prior.request_key is not null then if prior.round_id<>p_round or prior.request<>p_request then raise exception 'Command replay conflict';end if;return prior.response||jsonb_build_object('replayed',true);end if;
 select * into c from public.cash_game_config where id;
 if p_private->>'model' is distinct from c.model or p_private->>'game' is distinct from p_game or p_stake is null or p_return is null or p_stake<1 or p_return<0 or p_return>9000000000000 or p_stake>c.max_stake_minor or (p_done is distinct from ((p_private->>'phase')='settled')) then raise exception 'Invalid server game state';end if;
 select * into r from public.cash_game_rounds where id=p_round for update;
 if r.id is null then
  if p_revision<>-1 then raise exception 'Round missing';end if;
  if exists(select 1 from public.cash_game_rounds where user_id=p_user and state='open') then raise exception 'Resume the existing cash round first';end if;
  reason:=public.cash_game_eligibility(p_user);if reason is not null then raise exception '%',reason;end if;
  extra:=p_stake;
 else
  if r.user_id<>p_user or r.game<>p_game then raise exception 'Round ownership mismatch';end if;
  if r.state<>'open' or r.revision<>p_revision then raise exception 'Round changed; refresh before acting';end if;
  if p_stake<r.stake_minor then raise exception 'Stake cannot decrease';end if;
  extra:=p_stake-r.stake_minor;
  if extra>0 then reason:=public.cash_game_eligibility(p_user);if reason is not null then raise exception '%',reason;end if;end if;
 end if;
 if extra>0 then
  if p_geo_country is null or p_geo_country=any(c.blocked_countries) or not exists(select 1 from public.platform_settings where id and p_geo_country=any(allowed_countries)) then raise exception 'Verified location is not eligible';end if;
  -- Existing provider and original rounds share the same UTC daily loss budget.
  select greatest(0,coalesce((select sum(stake_minor-returned_minor) from public.cash_game_rounds where user_id=p_user and created_at>=(date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')),0)+coalesce((select sum(pr.stake_minor-pr.return_minor) from public.provider_rounds pr join public.provider_sessions ps on ps.id=pr.session_id where ps.user_id=p_user and pr.created_at>=(date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')),0)) into loss;
  if loss+extra>p.daily_loss_limit_minor then raise exception 'Daily loss limit exceeded';end if;
  if w.balance_minor<extra then raise exception 'Insufficient cash balance';end if;
 end if;
 paid:=case when p_done then p_return else 0 end;
 if w.balance_minor-extra+paid>9000000000000 then raise exception 'Wallet balance limit';end if;
 if r.id is null then insert into public.cash_game_rounds(id,user_id,game,model,state,stake_minor,returned_minor,private_state,public_state) values(p_round,p_user,p_game,c.model,case when p_done then 'settled' else 'open' end,p_stake,paid,p_private,p_public) returning * into r;
 else update public.cash_game_rounds set revision=revision+1,state=case when p_done then 'settled' else 'open' end,stake_minor=p_stake,returned_minor=paid,private_state=p_private,public_state=p_public,updated_at=now() where id=r.id returning * into r;end if;
 if extra>0 then update public.wallets set balance_minor=balance_minor-extra,updated_at=now() where user_id=p_user returning * into w;insert into public.cash_events(user_id,reference,kind,delta_minor,balance_after_minor) values(p_user,'game-stake:'||p_key,'game_stake',-extra,w.balance_minor);end if;
 if p_done then update public.wallets set balance_minor=balance_minor+paid,updated_at=now() where user_id=p_user returning * into w;insert into public.cash_events(user_id,reference,kind,delta_minor,balance_after_minor) values(p_user,'game-return:'||r.id,'game_return',paid,w.balance_minor);end if;
 answer:=jsonb_build_object('id',r.id,'revision',r.revision,'game',r.game,'state',r.state,'view',r.public_state,'balance_minor',w.balance_minor,'expires_at',r.expires_at);
 insert into public.cash_game_commands(user_id,request_key,round_id,request,response) values(p_user,p_key,r.id,p_request,answer);
 return answer;
end $$;
revoke all on function public.cash_game_eligibility(uuid),public.commit_cash_game(uuid,uuid,uuid,integer,text,jsonb,jsonb,jsonb,bigint,bigint,boolean,text) from public,anon,authenticated;
grant execute on function public.cash_game_eligibility(uuid),public.commit_cash_game(uuid,uuid,uuid,integer,text,jsonb,jsonb,jsonb,bigint,bigint,boolean,text) to service_role;
create or replace function public.provider_wallet_event(
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
    select greatest(0,coalesce((select sum(stake_minor-returned_minor) from public.cash_game_rounds where user_id=s.user_id and created_at>=(date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')),0)+coalesce((select sum(pr.stake_minor-pr.return_minor) from public.provider_rounds pr join public.provider_sessions ps on ps.id=pr.session_id where ps.user_id=s.user_id and pr.created_at>=(date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')),0)) into daily_loss;
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

create function public.configure_cash_games(p_actor uuid,p_data jsonb) returns void language plpgsql security definer set search_path='' as $$
declare is_enabled boolean:=(p_data->>'enabled')::boolean;countries text[];reason text:=btrim(coalesce(p_data->>'reason',''));
begin
 if not exists(select 1 from public.admin_roles where user_id=p_actor and role='owner') then raise exception 'Owner required';end if;
 if length(reason)<10 then raise exception 'Detailed reason required';end if;
 select coalesce(array_agg(distinct upper(value)),'{}') into countries from jsonb_array_elements_text(coalesce(p_data->'allowed_countries','[]'));
 if exists(select 1 from unnest(countries) code where code !~ '^[A-Z]{2}$') then raise exception 'Use ISO two-letter country codes';end if;
 if is_enabled and (coalesce((p_data->>'policy_reviewed')::boolean,false)=false or cardinality(countries)=0 or length(btrim(coalesce(p_data->>'operator_name','')))<2 or length(btrim(coalesce(p_data->>'license_authority','')))<2 or length(btrim(coalesce(p_data->>'license_reference','')))<2) then raise exception 'Operator, licence, approved countries and policy review required';end if;
 if exists(select 1 from unnest(countries) code where code=any(array['AU','KM','FR','NL','ES','GB','US'])) then raise exception 'An excluded country cannot be enabled';end if;
 update public.platform_settings set real_money_enabled=is_enabled,operator_name=p_data->>'operator_name',license_authority=p_data->>'license_authority',license_reference=p_data->>'license_reference',allowed_countries=countries,updated_at=now() where id;
 update public.cash_game_config set enabled=is_enabled where id;
 insert into public.admin_audit(actor_id,action,target,details) values(p_actor,'cash_game_settings','originals',p_data);
end $$;
revoke all on function public.configure_cash_games(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.configure_cash_games(uuid,jsonb) to service_role;

commit;
