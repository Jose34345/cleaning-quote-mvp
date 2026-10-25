import {client,arg} from './_common';
async function main(){const slug=arg('slug');if(!process.argv.includes('--payment-verified'))throw Error('Activation requires explicit --payment-verified confirmation from a real payment record');const db=client();
 const {data:b,error}=await db.from('businesses').select('id,status').eq('slug',slug).single();if(error||!b)throw Error('Business not found');
 const {data:s}=await db.from('subscriptions').select('status').eq('business_id',b.id).maybeSingle();
 if(!s||!['active','on_trial'].includes(s.status))throw Error('No active verified subscription found. Do not manually bypass paid access.');
 const {error:up}=await db.from('businesses').update({status:'active',updated_at:new Date().toISOString()}).eq('id',b.id);if(up)throw Error(up.message);console.log('Activated',slug);
}
main().catch(e=>{console.error(e.message);process.exit(1)});
