import {client,arg,configFile} from './_common';
async function main(){const slug=arg('slug'),config=configFile(arg('pricing'));const {data,error}=await client().from('businesses').update({pricing_config:config,updated_at:new Date().toISOString()}).eq('slug',slug).select('id,slug').single();if(error||!data)throw Error(error?.message||'Unknown business');console.log('Pricing updated:',data.slug)}
main().catch(e=>{console.error(e.message);process.exit(1)});
