import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createHmac, createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import type { PricingConfig } from '@/lib/pricing/calculate-quote';

export function db() {
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key) throw new Error('Database is not configured');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function businessBySlug(slug:string) {
  const {data,error}=await db().from('businesses').select('id,slug,display_name,status,pricing_config,notification_email').eq('slug',slug).eq('status','active').maybeSingle();
  if(error) throw new Error('Failed to load business');
  if(!data) return null;
  return data as {id:string;slug:string;display_name:string;status:string;notification_email:string;pricing_config:PricingConfig};
}
export function hashedClient(req:NextRequest) {
  // Vercel's platform-injected value; never trust an arbitrary custom forwarded chain in a non-proxied deployment.
  const ip=req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const secret=process.env.ABUSE_HASH_SECRET;
  if(!secret || secret.length<32) throw new Error('ABUSE_HASH_SECRET must be at least 32 characters');
  return createHmac('sha256',secret).update(ip).digest('hex');
}
export async function claimRateSlot(req:NextRequest,scope:string,limit:number) {
  const {data,error}=await db().rpc('claim_rate_slot',{p_scope:scope,p_fingerprint:hashedClient(req),p_limit:limit});
  if(error) throw new Error('Rate limit backend unavailable');
  return data === true;
}
export function digestToken(token:string){return createHash('sha256').update(token).digest('hex');}
export async function sendEmail(to:string,subject:string,html:string) {
  const key=process.env.RESEND_API_KEY, from=process.env.RESEND_FROM_EMAIL;
  if(!key||!from) return {ok:false,error:'Email provider not configured'};
  try {
    const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],subject,html}),signal:AbortSignal.timeout(10000)});
    return {ok:res.ok,error:res.ok?'':`Email provider returned ${res.status}`};
  }catch{return {ok:false,error:'Network error sending notification'};}
}
export function escapeHtml(v:string){return v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export function jsonError(message:string,status=400) {return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});}
