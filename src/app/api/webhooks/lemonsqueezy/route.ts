import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import {db,jsonError} from '@/lib/server';
import {validLemonSignature} from '@/lib/webhook';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  const secret=process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if(!secret || process.env.BILLING_LIVE_ENABLED!=='true') return jsonError('Billing is not enabled.',503);
  const raw=await req.text();
  if(!validLemonSignature(raw,req.headers.get('x-signature')||'',secret)) return jsonError('Invalid signature.',401);
  try{
    const event=JSON.parse(raw);
    const eventName=event?.meta?.event_name;
    if(!['subscription_created','subscription_updated','subscription_cancelled','subscription_resumed','subscription_expired','subscription_paused','subscription_unpaused','subscription_payment_success','subscription_payment_failed'].includes(eventName)) return Response.json({ok:true,ignored:true});
    const businessId=event?.meta?.custom_data?.business_id;
    const sub=event?.data;
    if(!/^[0-9a-f-]{36}$/i.test(businessId||'')||!sub?.id||!sub?.attributes?.status) return jsonError('Subscription identity missing.',422);
    const attrs=sub.attributes;
    const eventAt=attrs.updated_at||attrs.created_at;
    if(!eventAt || Number.isNaN(Date.parse(eventAt))) return jsonError('Invalid event time.',422);
    const eventId=createHash('sha256').update(raw).digest('hex');
    const {error}=await db().rpc('apply_subscription_event',{
      p_event_id:eventId,p_event_type:eventName,p_business_id:businessId,p_subscription_id:String(sub.id),
      p_customer_id:String(attrs.customer_id||''),p_status:String(attrs.status),
      p_period_end:attrs.renews_at||attrs.ends_at||null,p_event_at:eventAt
    });
    if(error) throw new Error(error.message);
    return Response.json({ok:true});
  }catch(e){ console.error('Verified webhook failed to process',e instanceof Error?e.message:'Unknown'); return jsonError('Webhook processing failed.',503); }
}
