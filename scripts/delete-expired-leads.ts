/** Run from trusted cron once a day. The default retention target is 90 days. */
import {client} from './_common';
async function main(){
 if(process.env.CONFIRM_RETENTION_DELETE!=='yes')throw Error('Set CONFIRM_RETENTION_DELETE=yes only in approved cron environment');
 const cutoff=new Date(Date.now()-90*86400000).toISOString();
 const db=client();
 const {error}=await db.from('quote_leads').delete().lt('created_at',cutoff);
 if(error)throw Error(error.message);
 const oldBuckets=new Date(Date.now()-86400000).toISOString();
 const {error:rateError}=await db.from('rate_windows').delete().lt('window_start',oldBuckets);
 if(rateError)throw Error(rateError.message);
 console.log('Retention cleanup executed');
}
main().catch(e=>{console.error(e.message);process.exit(1)});
