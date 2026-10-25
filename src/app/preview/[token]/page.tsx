import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {db,digestToken} from '@/lib/server';
import {QuoteForm} from '@/components/quote-form';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Private Concept Preview',robots:{index:false,follow:false}};
export default async function Preview({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[0-9a-f]{64}$/.test(token))notFound();
 const {data}=await db().from('preview_links').select('business_id,expires_at').eq('token_hash',digestToken(token)).gt('expires_at',new Date().toISOString()).maybeSingle();
 if(!data)notFound();
 const {data:business}=await db().from('businesses').select('display_name').eq('id',data.business_id).maybeSingle();
 if(!business)notFound();
 return <main className="page-background"><div className="container"><div className="preview-warning">Private concept preview for {business.display_name} — not affiliated with, authorized by, or endorsed by this company. Fictional prices only.</div><QuoteForm businessName={business.display_name} demo/></div></main>;
}
