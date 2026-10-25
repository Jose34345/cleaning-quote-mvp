import { NextRequest } from 'next/server';
import { setupSchema } from '@/lib/schema';
import {claimRateSlot,db,escapeHtml,jsonError,sendEmail} from '@/lib/server';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  try{
    const validated=setupSchema.safeParse(await req.json());
    if(!validated.success) return jsonError('Please check the form.',400);
    const {submissionId,owner,email,business,website,message,website2}=validated.data;
    if(website2) return jsonError('Request declined.',400);
    if(!await claimRateSlot(req,'setup',4)) return jsonError('Please try later.',429);
    const client=db();
    const {data,error}=await client.from('setup_requests').insert({submission_id:submissionId,owner,email,business,website,message}).select('id').single();
    if(error?.code==='23505') return Response.json({ok:true});
    if(error||!data) throw new Error('Request storage failed');
    const notify=process.env.SALES_NOTIFY_EMAIL;
    if(notify){
      const e=await sendEmail(notify,`Cleaning Quote setup request — ${business.replace(/[\r\n]/g,' ')}`,`<p>Owner: ${escapeHtml(owner)}</p><p>Business: ${escapeHtml(business)}</p><p>Email: ${escapeHtml(email)}</p><p>Website: ${escapeHtml(website)}</p><p>Message: ${escapeHtml(message)}</p>`);
      if(e.ok) await client.from('setup_requests').update({notification_status:'sent'}).eq('id',data.id);
    }
    return Response.json({ok:true});
  }catch(e){console.error('Setup request failed',e instanceof Error?e.message:'Unknown');return jsonError('Request could not be saved. Please try again.',503);}
}
