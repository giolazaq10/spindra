// Normalized adapter reference. Each provider needs a reviewed protocol adapter.
// Never put these credentials in VITE_ variables.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const encoder=new TextEncoder();
function response(status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
Deno.serve(async(req)=>{
  if(req.method!=='POST')return response(405,{error:'POST required'});
  const secret=Deno.env.get('PROVIDER_CALLBACK_SECRET'),provider=Deno.env.get('PROVIDER_SLUG');
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!secret||!provider||!url||!key||Deno.env.get('ENABLE_PROVIDER_CALLBACK')!=='true')return response(503,{error:'Provider adapter unavailable'});
  const timestamp=req.headers.get('x-spindra-timestamp')||'',signature=req.headers.get('x-spindra-signature')||'';
  if(!/^\d{10}$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300||!/^([a-f0-9]{64})$/i.test(signature))return response(401,{error:'Invalid signature'});
  // Bound streamed bodies even when Content-Length is omitted or false.
  const reader=req.body?.getReader();if(!reader)return response(400,{error:'Body required'});
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();return response(413,{error:'Body too large'});}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const raw=new TextDecoder('utf-8',{fatal:true});
  let text:string;try{text=raw.decode(bytes);}catch{return response(400,{error:'Invalid encoding'});}
  const hmac=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const supplied=Uint8Array.from(signature.match(/../g)!,x=>parseInt(x,16));
  if(!await crypto.subtle.verify('HMAC',hmac,supplied,encoder.encode(timestamp+'.'+text)))return response(401,{error:'Invalid signature'});
  let body:Record<string,unknown>;try{body=JSON.parse(text);if(!body||Array.isArray(body))throw new Error();}catch{return response(400,{error:'Invalid JSON'});}
  const {event_id,session_id,round_id,kind,amount_minor,currency}=body;
  if(typeof event_id!=='string'||event_id.length<1||event_id.length>200||typeof round_id!=='string'||round_id.length<1||round_id.length>200||typeof session_id!=='string'||!/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(session_id)||!['debit','credit','refund'].includes(String(kind))||typeof amount_minor!=='number'||!Number.isSafeInteger(amount_minor)||amount_minor<0||currency!=='USD')return response(400,{error:'Invalid event'});
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data,error}=await db.rpc('provider_wallet_event',{p_provider:provider,p_event:event_id,p_session:session_id,p_round:round_id,p_kind:kind,p_amount:amount_minor,p_currency:currency});
  if(error){console.warn('Wallet event rejected',{code:error.code});return response(409,{error:'Wallet event rejected'});}
  return response(200,data);
});

