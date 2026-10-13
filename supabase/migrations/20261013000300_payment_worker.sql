-- Worker endpoint is operator-configured; its authentication key stays in a private table.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
alter table public.payment_worker_config add column endpoint text;
create function public.configure_payment_worker(p_url text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_url !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/wallet-worker$' then raise exception 'Invalid worker endpoint';end if;
 update public.payment_worker_config set endpoint=p_url where id;
end $$;
create function public.invoke_crypto_worker() returns bigint language plpgsql security definer set search_path='' as $$
declare c public.payment_worker_config;request_id bigint;
begin
 select * into c from public.payment_worker_config where id;
 if c.endpoint is null then return null;end if;
 select net.http_post(url:=c.endpoint,headers:=jsonb_build_object('Content-Type','application/json','x-worker-key',c.secret),body:='{}'::jsonb,timeout_milliseconds:=5000) into request_id;
 return request_id;
end $$;
revoke all on function public.configure_payment_worker(text),public.invoke_crypto_worker() from public,anon,authenticated;
grant execute on function public.configure_payment_worker(text),public.invoke_crypto_worker() to service_role;
select cron.schedule('spindra-crypto-worker','* * * * *','select public.invoke_crypto_worker()');
