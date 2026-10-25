import { estimateRequest } from '@/lib/schema';
import { calculateQuote, QuoteError } from '@/lib/pricing/calculate-quote';
import { businessBySlug, claimRateSlot, jsonError } from '@/lib/server';
import type { NextRequest } from 'next/server';
export const runtime='nodejs';
export async function POST(req:NextRequest) {
  try {
    const body=await req.json(); const parsed=estimateRequest.safeParse(body);
    if(!parsed.success) return jsonError('Please check the form fields.',400);
    const {slug,...input}=parsed.data;
    const business=await businessBySlug(slug);
    if(!business) return jsonError('Quote page is unavailable.',404);
    if(!await claimRateSlot(req,`estimate:${business.id}`,30)) return jsonError('Too many requests. Please try again later.',429);
    const quote=calculateQuote(business.pricing_config,input);
    return Response.json(quote,{headers:{'Cache-Control':'no-store'}});
  } catch(e) {
    if(e instanceof QuoteError) return jsonError(e.message,422);
    console.error('Estimate request failed',e instanceof Error?e.message:'Unknown');
    return jsonError('Estimate temporarily unavailable.',503);
  }
}
