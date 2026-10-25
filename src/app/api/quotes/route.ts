import { NextRequest } from 'next/server';
import { leadRequest } from '@/lib/schema';
import { calculateQuote,QuoteError,USD } from '@/lib/pricing/calculate-quote';
import { businessBySlug,claimRateSlot,db,escapeHtml,jsonError,sendEmail } from '@/lib/server';
export const runtime='nodejs';
export async function POST(req:NextRequest) {
  try {
    const body=await req.json(); const result=leadRequest.safeParse(body);
    if(!result.success) return jsonError('Please check all required fields.',400);
    const {slug,submissionId,name,email,phone,consent,website,...input}=result.data;
    if(website) return jsonError('Unable to process this request.',400);
    const business=await businessBySlug(slug);
    if(!business) return jsonError('This business is not accepting quotes.',404);
    const quote=calculateQuote(business.pricing_config,input);
    if(!await claimRateSlot(req,`lead:${business.id}`,6)) return jsonError('Too many requests. Please try again later.',429);
    const client=db();
    const {data,error}=await client.from('quote_leads').insert({
      business_id:business.id,submission_id:submissionId,customer_name:name,customer_email:email,
      customer_phone:phone||null,zip_code:input.zip,service_type:input.service,
      bedrooms:input.bedrooms,bathrooms:input.bathrooms,frequency:input.frequency,
      selected_extras:input.extras,estimated_min_cents:quote.minCents,estimated_max_cents:quote.maxCents,
      consent_timestamp:new Date().toISOString()
    }).select('id').single();
    if(error?.code==='23505') return Response.json({ok:true,duplicate:true},{headers:{'Cache-Control':'no-store'}});
    if(error||!data) throw new Error('Lead storage failed');
    await client.from('product_events').insert({event_name:'lead_submitted',business_id:business.id,is_demo:false,source:'server'});
    const fields=[['Customer',name],['Email',email],['Phone',phone||'Not provided'],['ZIP',input.zip],['Service',input.service],['Bedrooms',String(input.bedrooms)],['Bathrooms',String(input.bathrooms)],['Frequency',input.frequency],['Extras',input.extras.join(', ')||'None'],['Estimate',`${USD(quote.minCents)} – ${USD(quote.maxCents)}`]];
    const html=`<h2>New cleaning quote request</h2><table>${fields.map(([k,v])=>`<tr><th align="left">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</table><p>${escapeHtml(quote.disclaimer)}</p>`;
    const sent=await sendEmail(business.notification_email,`New Cleaning Quote Request — ${name.replace(/[\r\n]/g,' ')}`,html);
    await client.from('quote_leads').update({notification_status:sent.ok?'sent':'pending',notification_last_error:sent.ok?null:sent.error}).eq('id',data.id);
    if(!sent.ok) console.error('Pending lead notification',data.id,sent.error);
    return Response.json({ok:true,notificationPending:!sent.ok},{headers:{'Cache-Control':'no-store'}});
  } catch(e) {
    if(e instanceof QuoteError) return jsonError(e.message,422);
    console.error('Lead submission failed',e instanceof Error?e.message:'Unknown');
    return jsonError('Sorry, your request could not be submitted. Please try again.',503);
  }
}
