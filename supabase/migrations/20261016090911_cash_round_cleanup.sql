create function public.invoke_cash_cleanup() returns bigint language plpgsql security definer set search_path='' as $$
declare config public.payment_worker_config;rid bigint;
begin
 select * into config from public.payment_worker_config where id;
 if config.endpoint is null then return null;end if;
 select net.http_post(url:=replace(config.endpoint,'/wallet-worker','/cash-games'),headers:=jsonb_build_object('Content-Type','application/json','x-worker-key',config.secret),body:='{"action":"cleanup"}'::jsonb,timeout_milliseconds:=5000) into rid;return rid;
end $$;
revoke all on function public.invoke_cash_cleanup() from public,anon,authenticated;
grant execute on function public.invoke_cash_cleanup() to service_role;
select cron.schedule('spindra-cash-cleanup','* * * * *','select public.invoke_cash_cleanup()');
