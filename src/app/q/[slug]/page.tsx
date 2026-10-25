import {EventPing} from '@/components/event-ping';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {QuoteForm} from '@/components/quote-form';
import {businessBySlug} from '@/lib/server';
import type {Extra,Service} from '@/lib/pricing/calculate-quote';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Request a Cleaning Estimate',robots:{index:false,follow:false}};
export default async function PublicQuote({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))notFound();
 const b=await businessBySlug(slug); if(!b)notFound();
 const services=Object.keys(b.pricing_config.serviceBaseCents) as Service[];
 const extras=Object.keys(b.pricing_config.extrasCents) as Extra[];
 return <main className="page-background"><div className="container"><EventPing event="quote_started" slug={slug}/><QuoteForm slug={slug} businessName={b.display_name} services={services} extras={extras}/></div></main>
}
