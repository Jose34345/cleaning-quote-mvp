import {createClient} from '@supabase/supabase-js';
import {readFileSync} from 'node:fs';
import {validatePricingConfig,type PricingConfig} from '../src/lib/pricing/calculate-quote';
export function client(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;if(!url||!key)throw Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY');return createClient(url,key,{auth:{persistSession:false}})}
export function arg(name:string){const i=process.argv.indexOf('--'+name);if(i<0||!process.argv[i+1])throw Error('Missing --'+name);return process.argv[i+1];}
export function configFile(path:string){const c=JSON.parse(readFileSync(path,'utf8')) as PricingConfig;validatePricingConfig(c);return c;}
