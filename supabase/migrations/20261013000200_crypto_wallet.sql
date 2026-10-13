begin;
create table public.admin_roles(user_id uuid primary key references auth.users(id) on delete restrict,role text not null check(role in ('owner','operator','support')),created_at timestamptz not null default now());
alter table public.admin_roles enable row level security;
create policy own_admin_role on public.admin_roles for select to authenticated using(user_id=auth.uid());
revoke all on public.admin_roles from anon,authenticated;grant select on public.admin_roles to authenticated;
-- One-time, explicit owner bootstrap for the sole existing account. Never a signup trigger.
do $$ begin if (select count(*) from auth.users)=1 then insert into public.admin_roles(user_id,role) select id,'owner' from auth.users; end if; end $$;
create function public.my_admin_role() returns text language sql stable security definer set search_path='' as $$select role from public.admin_roles where user_id=auth.uid()$$;
revoke all on function public.my_admin_role() from public,anon;grant execute on function public.my_admin_role() to authenticated;
create table public.payment_settings(id boolean primary key default true check(id),deposits_enabled boolean not null default false,withdrawals_enabled boolean not null default false,automatic_withdrawals boolean not null default true,auto_limit_minor bigint not null default 10000 check(auto_limit_minor between 0 and 100000000),daily_withdrawal_limit_minor bigint not null default 50000 check(daily_withdrawal_limit_minor between 1 and 100000000),updated_at timestamptz not null default now());
insert into public.payment_settings(id) values(true);
alter table public.payment_settings enable row level security;
create policy payment_settings_read on public.payment_settings for select to authenticated using(true);
revoke all on public.payment_settings from anon,authenticated;grant select on public.payment_settings to authenticated;
create table public.crypto_assets(code text primary key check(code ~ '^[a-z0-9]{2,30}$'),symbol text not null,name text not null,network text not null,memo_required boolean not null default false,deposits_enabled boolean not null default true,withdrawals_enabled boolean not null default true);
insert into public.crypto_assets(code,symbol,name,network,memo_required) values
('btc','BTC','Bitcoin','Bitcoin',false),('eth','ETH','Ethereum','Ethereum',false),('ltc','LTC','Litecoin','Litecoin',false),('doge','DOGE','Dogecoin','Dogecoin',false),('bch','BCH','Bitcoin Cash','Bitcoin Cash',false),('trx','TRX','TRON','TRON',false),('sol','SOL','Solana','Solana',false),('xrp','XRP','XRP','XRP Ledger',true),('xlm','XLM','Stellar','Stellar',true),('ada','ADA','Cardano','Cardano',false),('avaxc','AVAX','Avalanche','Avalanche C-Chain',false),('bnbbsc','BNB','BNB','BNB Smart Chain',false),('usdterc20','USDT','Tether','Ethereum (ERC-20)',false),('usdttrc20','USDT','Tether','TRON (TRC-20)',false),('usdtbsc','USDT','Tether','BNB Smart Chain (BEP-20)',false),('usdtsol','USDT','Tether','Solana',false),('usdc','USDC','USD Coin','Ethereum (ERC-20)',false),('usdcmatic','USDC','USD Coin','Polygon',false),('ton','TON','Toncoin','TON',true),('dash','DASH','Dash','Dash',false),('zec','ZEC','Zcash','Zcash',false);
alter table public.crypto_assets enable row level security;create policy crypto_assets_read on public.crypto_assets for select to authenticated using(true);
revoke all on public.crypto_assets from anon,authenticated;grant select on public.crypto_assets to authenticated;
create table public.deposit_addresses(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.player_profiles(id),asset text not null references public.crypto_assets(code),status text not null default 'creating' check(status in ('creating','ready','review_required','failed')),address text,memo text,provider_payment_id text unique,order_id text unique not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,asset),check(status<>'ready' or (address is not null and provider_payment_id is not null)));
create unique index unique_deposit_route on public.deposit_addresses(asset,address,coalesce(memo,'')) where address is not null;
alter table public.deposit_addresses enable row level security;create policy own_deposit_addresses on public.deposit_addresses for select to authenticated using(user_id=auth.uid());
create table public.deposit_receipts(payment_id text primary key,address_id uuid not null references public.deposit_addresses(id),asset text not null,settled_crypto_amount numeric(38,18) not null check(settled_crypto_amount>0),outcome_currency text not null,amount_minor bigint not null check(amount_minor between 1 and 9000000000000),provider_status text not null check(provider_status='finished'),credited_at timestamptz not null default now());
alter table public.deposit_receipts enable row level security;create policy own_deposit_receipts on public.deposit_receipts for select to authenticated using(exists(select 1 from public.deposit_addresses a where a.id=address_id and a.user_id=auth.uid()));
create table public.payment_worker_config(id boolean primary key default true check(id),secret text not null default (replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','')));
insert into public.payment_worker_config(id) values(true);
alter table public.payment_worker_config enable row level security;
revoke all on public.payment_worker_config from public,anon,authenticated;
create function public.payment_worker_secret() returns text language sql security definer set search_path='' as $$select secret from public.payment_worker_config where id=true$$;
revoke all on function public.payment_worker_secret() from public,anon,authenticated;
grant execute on function public.payment_worker_secret() to service_role;
create table public.withdrawal_quotes(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.player_profiles(id),asset text not null references public.crypto_assets(code),address text not null,memo text,amount_minor bigint not null check(amount_minor between 1 and 100000000),crypto_amount numeric(38,18) not null check(crypto_amount>0),fee_crypto numeric(38,18) not null check(fee_crypto>=0),expires_at timestamptz not null,created_at timestamptz not null default now());
alter table public.withdrawal_quotes enable row level security;
create table public.withdrawals(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.player_profiles(id),quote_id uuid unique not null references public.withdrawal_quotes(id),request_key uuid not null,asset text not null references public.crypto_assets(code),address text not null,memo text,amount_minor bigint not null,crypto_amount numeric(38,18) not null,fee_crypto numeric(38,18) not null,status text not null check(status in ('queued','review_required','submitting','submitted','verification_required','submission_unknown','finished','rejected','cancelled')),provider_id text unique,provider_batch_id text,tx_hash text,reason text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,request_key));
alter table public.withdrawals enable row level security;create policy own_withdrawals on public.withdrawals for select to authenticated using(user_id=auth.uid());
create table public.cash_events(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.player_profiles(id),reference text unique not null,kind text not null check(kind in ('deposit','withdrawal_reserve','withdrawal_refund','admin_adjustment')),delta_minor bigint not null,balance_after_minor bigint not null,created_at timestamptz not null default now());
alter table public.cash_events enable row level security;create policy own_cash_events on public.cash_events for select to authenticated using(user_id=auth.uid());
create table public.admin_audit(id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id),action text not null,target text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
alter table public.admin_audit enable row level security;
revoke all on public.deposit_addresses,public.deposit_receipts,public.withdrawal_quotes,public.withdrawals,public.cash_events,public.admin_audit from anon,authenticated;
grant select on public.deposit_addresses,public.deposit_receipts,public.withdrawals,public.cash_events to authenticated;
grant all on public.admin_roles,public.payment_settings,public.crypto_assets,public.deposit_addresses,public.deposit_receipts,public.withdrawal_quotes,public.withdrawals,public.cash_events,public.admin_audit to service_role;
create function public.claim_deposit_address(p_user uuid,p_asset text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.deposit_addresses; fresh boolean:=false; new_id uuid:=gen_random_uuid();
begin
 perform 1 from public.player_profiles where id=p_user and account_status='active' for update;if not found then raise exception 'Active account required';end if;
 if not exists(select 1 from public.payment_settings where id and deposits_enabled) then raise exception 'Deposits paused';end if;
 if not exists(select 1 from public.crypto_assets where code=p_asset and deposits_enabled) then raise exception 'Asset unavailable';end if;
 select * into a from public.deposit_addresses where user_id=p_user and asset=p_asset for update;
 if a.id is null then insert into public.deposit_addresses(id,user_id,asset,order_id) values(new_id,p_user,p_asset,'spindra-deposit-'||new_id) returning * into a;fresh:=true;end if;
 return jsonb_build_object('fresh',fresh,'address',to_jsonb(a));
end $$;
create function public.credit_crypto_deposit(p_payment text,p_address uuid,p_asset text,p_crypto numeric,p_outcome text,p_minor bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.deposit_addresses;prior public.deposit_receipts;w public.wallets;
begin
 select * into a from public.deposit_addresses where id=p_address and status='ready';if a.id is null or a.asset<>p_asset then raise exception 'Unknown deposit route';end if;
 perform 1 from public.player_profiles where id=a.user_id for update;select * into w from public.wallets where user_id=a.user_id for update;
 select * into prior from public.deposit_receipts where payment_id=p_payment;
 if prior.payment_id is not null then if prior.address_id<>p_address or prior.asset<>p_asset or prior.settled_crypto_amount<>p_crypto or prior.outcome_currency<>p_outcome then raise exception 'Deposit replay conflict';end if;return jsonb_build_object('replayed',true,'balance_minor',w.balance_minor);end if;
 if p_payment is null or p_payment='' or p_minor is null or p_minor<1 or p_crypto is null or p_crypto<=0 or w.user_id is null then raise exception 'Invalid deposit';end if;
 if w.balance_minor+p_minor>9000000000000 then raise exception 'Balance limit';end if;
 insert into public.deposit_receipts(payment_id,address_id,asset,settled_crypto_amount,outcome_currency,amount_minor,provider_status) values(p_payment,p_address,p_asset,p_crypto,p_outcome,p_minor,'finished');
 update public.wallets set balance_minor=balance_minor+p_minor,updated_at=now() where user_id=a.user_id returning * into w;
 insert into public.cash_events(user_id,reference,kind,delta_minor,balance_after_minor) values(a.user_id,'deposit:'||p_payment,'deposit',p_minor,w.balance_minor);
 return jsonb_build_object('replayed',false,'balance_minor',w.balance_minor);
end $$;
create function public.request_crypto_withdrawal(p_user uuid,p_quote uuid,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.withdrawal_quotes;p public.player_profiles;w public.wallets;s public.payment_settings;r public.withdrawals;spent bigint;
begin
 select * into p from public.player_profiles where id=p_user for update;select * into w from public.wallets where user_id=p_user for update;
 select * into r from public.withdrawals where user_id=p_user and request_key=p_key;
 if r.id is not null then if r.quote_id<>p_quote then raise exception 'Request key conflict';end if;return to_jsonb(r);end if;
 select * into s from public.payment_settings where id=true for share;
 if not s.withdrawals_enabled then raise exception 'Withdrawals paused';end if;
 if p.kyc_status<>'verified' or p.account_status<>'active' or p.date_of_birth is null or p.date_of_birth>(current_date-interval '18 years')::date or not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'Verified adult account and confirmed email required';end if;
 select * into q from public.withdrawal_quotes where id=p_quote and user_id=p_user for update;
 if q.id is null or q.expires_at<=now() then raise exception 'Quote expired';end if;
 if not exists(select 1 from public.crypto_assets where code=q.asset and withdrawals_enabled) then raise exception 'Asset withdrawals paused';end if;
 select coalesce(sum(amount_minor),0) into spent from public.withdrawals where user_id=p_user and status not in ('rejected','cancelled') and created_at>=(date_trunc('day',now() at time zone 'UTC') at time zone 'UTC');
 if spent+q.amount_minor>s.daily_withdrawal_limit_minor then raise exception 'Daily withdrawal limit';end if;
 if w.user_id is null or w.balance_minor<q.amount_minor then raise exception 'Insufficient cash balance';end if;
 insert into public.withdrawals(user_id,quote_id,request_key,asset,address,memo,amount_minor,crypto_amount,fee_crypto,status)
 values(p_user,p_quote,p_key,q.asset,q.address,q.memo,q.amount_minor,q.crypto_amount,q.fee_crypto,case when s.automatic_withdrawals and q.amount_minor<=s.auto_limit_minor then 'queued' else 'review_required' end) returning * into r;
 update public.wallets set balance_minor=balance_minor-q.amount_minor,updated_at=now() where user_id=p_user returning * into w;
 insert into public.cash_events(user_id,reference,kind,delta_minor,balance_after_minor) values(p_user,'withdrawal:'||r.id,'withdrawal_reserve',-q.amount_minor,w.balance_minor);
 return to_jsonb(r);
end $$;
create function public.claim_crypto_withdrawal() returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.withdrawals;
begin
 if not exists(select 1 from public.payment_settings where id and withdrawals_enabled) then return null;end if;
 select w.* into r from public.withdrawals w join public.player_profiles p on p.id=w.user_id join public.crypto_assets a on a.code=w.asset where w.status='queued' and p.account_status='active' and p.kyc_status='verified' and p.date_of_birth is not null and p.date_of_birth<=(current_date-interval '18 years')::date and a.withdrawals_enabled order by w.created_at for update of w skip locked limit 1;
 if r.id is null then return null;end if;
 update public.withdrawals set status='submitting',updated_at=now() where id=r.id returning * into r;return to_jsonb(r);
end $$;
create function public.complete_crypto_withdrawal(p_id uuid,p_status text,p_hash text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.withdrawals;w public.wallets;
begin
 select * into r from public.withdrawals where id=p_id;if r.id is null then raise exception 'Withdrawal missing';end if;
 perform 1 from public.player_profiles where id=r.user_id for update;select * into w from public.wallets where user_id=r.user_id for update;select * into r from public.withdrawals where id=p_id for update;
 if r.status in ('finished','rejected','cancelled') then if r.status<>p_status then raise exception 'Terminal status conflict';end if;return to_jsonb(r);end if;
 if p_status not in ('finished','rejected','cancelled') then raise exception 'Invalid terminal status';end if;
 if p_status='finished' and r.provider_id is null then raise exception 'Provider payout missing';end if;
 if p_status='cancelled' and r.status not in ('queued','review_required') then raise exception 'Submitted withdrawals cannot be cancelled locally';end if;
 if p_status='rejected' and r.status not in ('submitted','verification_required','review_required') then raise exception 'Uncertain payout cannot be refunded';end if;
 if p_status in ('rejected','cancelled') then update public.wallets set balance_minor=balance_minor+r.amount_minor,updated_at=now() where user_id=r.user_id returning * into w;insert into public.cash_events(user_id,reference,kind,delta_minor,balance_after_minor) values(r.user_id,'refund:'||r.id,'withdrawal_refund',r.amount_minor,w.balance_minor);end if;
 update public.withdrawals set status=p_status,tx_hash=coalesce(p_hash,tx_hash),updated_at=now() where id=r.id returning * into r;return to_jsonb(r);
end $$;
create function public.admin_payment_action(p_actor uuid,p_action text,p_target text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare role_name text;r public.withdrawals;reason text:=btrim(coalesce(p_data->>'reason',''));begin
 select role into role_name from public.admin_roles where user_id=p_actor;if role_name is null or role_name='support' then raise exception 'Admin permission required';end if;
 if p_action='settings' then
  if role_name is distinct from 'owner' then raise exception 'Owner required';end if;
  update public.payment_settings set deposits_enabled=(p_data->>'deposits_enabled')::boolean,withdrawals_enabled=(p_data->>'withdrawals_enabled')::boolean,automatic_withdrawals=(p_data->>'automatic_withdrawals')::boolean,auto_limit_minor=(p_data->>'auto_limit_minor')::bigint,daily_withdrawal_limit_minor=(p_data->>'daily_withdrawal_limit_minor')::bigint,updated_at=now() where id;
 elsif p_action='asset' then
  update public.crypto_assets set deposits_enabled=(p_data->>'deposits_enabled')::boolean,withdrawals_enabled=(p_data->>'withdrawals_enabled')::boolean where code=p_target;if not found then raise exception 'Asset missing';end if;
 elsif p_action='player' then
  if length(reason)<5 then raise exception 'Reason required';end if;
  update public.player_profiles set account_status=coalesce(p_data->>'account_status',account_status),kyc_status=coalesce(p_data->>'kyc_status',kyc_status),date_of_birth=coalesce((p_data->>'date_of_birth')::date,date_of_birth),country=coalesce(p_data->>'country',country) where id=p_target::uuid;if not found then raise exception 'Player missing';end if;
 elsif p_action='balance_adjustment' then
  if role_name is distinct from 'owner' or length(reason)<10 then raise exception 'Owner and detailed reason required';end if;
  if p_data->>'request_key' is null then raise exception 'Adjustment request key required';end if;
  perform 1 from public.player_profiles where id=p_target::uuid for update;
  perform 1 from public.wallets where user_id=p_target::uuid for update;
  if exists(select 1 from public.cash_events where reference='adjustment:'||(p_data->>'request_key')) then
   if not exists(select 1 from public.cash_events where reference='adjustment:'||(p_data->>'request_key') and user_id=p_target::uuid and delta_minor=(p_data->>'delta_minor')::bigint) then raise exception 'Adjustment replay conflict';end if;
   return jsonb_build_object('ok',true,'replayed',true);
  end if;
  if abs((p_data->>'delta_minor')::bigint)>100000000 or (p_data->>'delta_minor')::bigint=0 then raise exception 'Adjustment limit';end if;
  update public.wallets set balance_minor=balance_minor+(p_data->>'delta_minor')::bigint,updated_at=now() where user_id=p_target::uuid;
  if not found then raise exception 'Wallet missing';end if;
  insert into public.cash_events(user_id,reference,kind,delta_minor,balance_after_minor) select p_target::uuid,'adjustment:'||(p_data->>'request_key'),'admin_adjustment',(p_data->>'delta_minor')::bigint,balance_minor from public.wallets where user_id=p_target::uuid;
 elsif p_action='role' then
  perform pg_advisory_xact_lock(821041);
  select role into role_name from public.admin_roles where user_id=p_actor;
  if role_name is distinct from 'owner' or length(reason)<5 then raise exception 'Owner and reason required';end if;
  if exists(select 1 from public.admin_roles where user_id=p_target::uuid and role='owner') and p_data->>'role' is distinct from 'owner' and (select count(*) from public.admin_roles where role='owner')<=1 then raise exception 'Cannot remove the last owner';end if;
  if p_data->>'role'='none' then delete from public.admin_roles where user_id=p_target::uuid;else insert into public.admin_roles(user_id,role) values(p_target::uuid,p_data->>'role') on conflict(user_id) do update set role=excluded.role;end if;
 elsif p_action='integration' then
  if role_name is distinct from 'owner' then raise exception 'Owner required';end if;
  update public.provider_integrations set enabled=(p_data->>'enabled')::boolean where slug=p_target;if not found then raise exception 'Integration missing';end if;
 elsif p_action='approve_withdrawal' then
  if length(reason)<5 then raise exception 'Reason required';end if;
  update public.withdrawals set status='queued',reason=reason,updated_at=now() where id=p_target::uuid and status='review_required';if not found then raise exception 'Withdrawal not awaiting review';end if;
 elsif p_action='cancel_withdrawal' then
  if length(reason)<5 then raise exception 'Reason required';end if;perform public.complete_crypto_withdrawal(p_target::uuid,'cancelled',null);
 else raise exception 'Unsupported admin action';end if;
 insert into public.admin_audit(actor_id,action,target,details) values(p_actor,p_action,p_target,p_data);return jsonb_build_object('ok',true);
end $$;
revoke all on function public.claim_deposit_address(uuid,text),public.credit_crypto_deposit(text,uuid,text,numeric,text,bigint),public.request_crypto_withdrawal(uuid,uuid,uuid),public.claim_crypto_withdrawal(),public.complete_crypto_withdrawal(uuid,text,text),public.admin_payment_action(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.claim_deposit_address(uuid,text),public.credit_crypto_deposit(text,uuid,text,numeric,text,bigint),public.request_crypto_withdrawal(uuid,uuid,uuid),public.claim_crypto_withdrawal(),public.complete_crypto_withdrawal(uuid,text,text),public.admin_payment_action(uuid,text,text,jsonb) to service_role;
grant all on public.player_profiles,public.wallets,public.provider_integrations,public.platform_settings to service_role;
commit;
