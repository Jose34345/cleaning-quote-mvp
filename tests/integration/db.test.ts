/** Opt-in integration gates. NEVER point TEST_DB_URL at production. */
import {describe,it,expect,beforeAll,afterAll} from 'vitest';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
const ready=!!(process.env.TEST_DB_URL && process.env.TEST_DB_SECRET_KEY && process.env.TEST_DB_PUBLISHABLE_KEY && process.env.TEST_DB_ALLOW_MUTATION==='yes' && process.env.TEST_DB_URL!==process.env.SUPABASE_URL);
let admin:SupabaseClient,anon:SupabaseClient,a:string,b:string;
const config={currency:'USD',serviceBaseCents:{standard:9000},bedroomCents:1500,bathroomCents:2000,extrasCents:{},frequencyPermille:{once:1000,weekly:950,biweekly:950,monthly:950},minimumCents:9000,rangePercent:10,disclaimer:'Illustrative estimate. Confirm final price with the cleaning company.'};
describe.skipIf(!ready)('isolated TEST database / billing idempotence',()=>{
 beforeAll(async()=>{
  admin=createClient(process.env.TEST_DB_URL!,process.env.TEST_DB_SECRET_KEY!);anon=createClient(process.env.TEST_DB_URL!,process.env.TEST_DB_PUBLISHABLE_KEY!);
  const s=crypto.randomUUID().slice(0,8);const {data,error}=await admin.from('businesses').insert([{slug:'test-a-'+s,display_name:'Test A',owner_email:'test@example.com',notification_email:'test@example.com',pricing_config:config},{slug:'test-b-'+s,display_name:'Test B',owner_email:'test@example.com',notification_email:'test@example.com',pricing_config:config}]).select('id');if(error||!data)throw Error(error?.message||'Cannot seed');a=data[0].id;b=data[1].id;
 });
 afterAll(async()=>{if(a&&b)await admin.from('businesses').delete().in('id',[a,b])});
 it('anon cannot read tenants',async()=>{const r=await anon.from('businesses').select('*');expect(r.data??[]).toHaveLength(0)});
 it('anon cannot read leads',async()=>{const r=await anon.from('quote_leads').select('*');expect(r.data??[]).toHaveLength(0)});
 it('lead idempotency is per tenant',async()=>{const id=crypto.randomUUID();const payload={submission_id:id,customer_name:'Demo User',customer_email:'demo@example.com',zip_code:'78701',service_type:'standard',bedrooms:2,bathrooms:1,frequency:'once',selected_extras:[],estimated_min_cents:10000,estimated_max_cents:12000,consent_timestamp:new Date().toISOString()};const first=await admin.from('quote_leads').insert({...payload,business_id:a});expect(first.error).toBeNull();const dupe=await admin.from('quote_leads').insert({...payload,business_id:a});expect(dupe.error?.code).toBe('23505');const different=await admin.from('quote_leads').insert({...payload,business_id:b});expect(different.error).toBeNull()});
 it('signed webhook processing is idempotent',async()=>{const id=crypto.randomUUID(),time=new Date().toISOString();const args={p_event_id:id,p_event_type:'subscription_created',p_business_id:a,p_subscription_id:id,p_customer_id:'test-customer',p_status:'active',p_period_end:null,p_event_at:time};const first=await admin.rpc('apply_subscription_event',args);expect(first.error).toBeNull();expect(first.data).toBe(true);const duplicate=await admin.rpc('apply_subscription_event',args);expect(duplicate.data).toBe(false);});
});
