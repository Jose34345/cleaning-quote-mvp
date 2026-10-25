import type {NextRequest} from 'next/server';
import {z} from 'zod';
import {businessBySlug,claimRateSlot,db,jsonError} from '@/lib/server';
export const runtime='nodejs';
const schema=z.object({event:z.enum(['landing_view','demo_opened','quote_started','quote_completed']),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),demo:z.boolean().optional()}).strict();
export async function POST(req:NextRequest){
 try{
  const parsed=schema.safeParse(await req.json());if(!parsed.success)return jsonError('Invalid event.',400);
  if(!await claimRateSlot(req,'analytics',60))return jsonError('Slow down.',429);
  const {event,slug,demo=false}=parsed.data;
  let businessId:string|null=null;
  if(slug){const b=await businessBySlug(slug);if(!b)return jsonError('Business unavailable.',404);businessId=b.id;}
  const {error}=await db().from('product_events').insert({event_name:event,business_id:businessId,is_demo:demo,source:'public'});
  if(error)throw new Error('Event storage failed');
  return Response.json({ok:true});
 }catch(e){console.error('Telemetry error',e instanceof Error?e.message:'Unknown');return jsonError('Unable to record event.',503);}
}
