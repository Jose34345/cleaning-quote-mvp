import {randomBytes,createHash} from 'node:crypto';
import {client,arg} from './_common';
async function main(){const slug=arg('slug');const {data:b,error}=await client().from('businesses').select('id').eq('slug',slug).single();if(error||!b)throw Error('Business not found');
 const token=randomBytes(32).toString('hex');const hash=createHash('sha256').update(token).digest('hex');
 const {error:insertError}=await client().from('preview_links').insert({business_id:b.id,token_hash:hash,expires_at:new Date(Date.now()+7*86400000).toISOString()});
 if(insertError)throw Error(insertError.message);
 console.log('PRIVATE LINK (copy once; do not commit):',(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000')+'/preview/'+token);
}
main().catch(e=>{console.error(e.message);process.exit(1)});
