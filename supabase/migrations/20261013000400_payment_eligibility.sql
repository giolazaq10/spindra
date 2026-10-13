-- Serialize owner changes and recheck adult eligibility when claiming queued payouts.
create or replace function public.claim_crypto_withdrawal() returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.withdrawals;
begin
 if not exists(select 1 from public.payment_settings where id and withdrawals_enabled) then return null;end if;
 select w.* into r from public.withdrawals w join public.player_profiles p on p.id=w.user_id join public.crypto_assets a on a.code=w.asset where w.status='queued' and p.account_status='active' and p.kyc_status='verified' and p.date_of_birth is not null and p.date_of_birth<=(current_date-interval '18 years')::date and a.withdrawals_enabled order by w.created_at for update of w skip locked limit 1;
 if r.id is null then return null;end if;
 update public.withdrawals set status='submitting',updated_at=now() where id=r.id returning * into r;return to_jsonb(r);
end $$;
create or replace function public.admin_payment_action(p_actor uuid,p_action text,p_target text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
