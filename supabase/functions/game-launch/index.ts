// Fail closed until a real provider protocol adapter has been implemented.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
Deno.serve(async(req)=>{
  const origin=Deno.env.get('APP_ORIGIN')||'';
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return new Response(JSON.stringify({error:'POST required'}),{status:405,headers});
  const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');
  if(!token)return new Response(JSON.stringify({error:'Sign in required'}),{status:401,headers});
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false}});
  const {data,error}=await db.auth.getUser(token);
  if(error||!data.user)return new Response(JSON.stringify({error:'Invalid session'}),{status:401,headers});
  return new Response(JSON.stringify({error:'Provider launch adapter is not configured. Cash wagering is unavailable.'}),{status:503,headers});
});

