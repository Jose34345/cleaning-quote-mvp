'use client';
import {useState,type FormEvent} from 'react';
import { calculateQuote,USD,QuoteError,type QuoteInput,type PricingConfig,type Service,type Frequency,type Extra } from '@/lib/pricing/calculate-quote';
import {DEMO_CONFIG} from '@/lib/pricing/demo';
import {resolveQuoteSubmissionAction} from '@/lib/quote-submission';

const SERVICES: Record<Service,string>={standard:'Standard Cleaning',deep:'Deep Cleaning',move:'Move-In / Move-Out'};
const FREQ:Record<Frequency,string>={once:'One-Time',weekly:'Weekly',biweekly:'Every Two Weeks',monthly:'Monthly'};
const EXTRAS:Record<Extra,string>={oven:'Inside Oven',fridge:'Inside Refrigerator',windows:'Interior Windows'};
const STEPS=['Location','Service','Home','Schedule','Extras','Estimate','Request'];
type Result={minCents:number;maxCents:number;disclaimer:string};
type Props={slug?:string; businessName:string; demo?:boolean; demoConfig?:PricingConfig; services?:Service[];extras?:Extra[]};
const INITIAL:QuoteInput={zip:'',service:'standard',bedrooms:2,bathrooms:1,frequency:'once',extras:[]};
export function QuoteForm({slug,businessName,demo=false,demoConfig=DEMO_CONFIG,services=['standard','deep','move'],extras=['oven','fridge','windows']}:Props){
  const [form,setForm]=useState<QuoteInput>({...INITIAL,service:services[0]??'standard'});
  const [step,setStep]=useState(0),[estimate,setEstimate]=useState<Result|null>(null),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[success,setSuccess]=useState(false),[notificationPending,setNotificationPending]=useState(false);
  const [lead,setLead]=useState({name:'',email:'',phone:'',consent:false});
  const [submissionId]=useState(()=>crypto.randomUUID());
  const patch=(data:Partial<QuoteInput>)=>{setForm(a=>({...a,...data}));setEstimate(null);setError('');};
  async function next(){
    setError('');
    if(step===0 && !/^\d{5}$/.test(form.zip)) return setError('Enter a five-digit ZIP code.');
    if(step===2 && (!Number.isInteger(form.bedrooms)||!Number.isInteger(form.bathrooms)||form.bedrooms<0||form.bedrooms>12||form.bathrooms<1||form.bathrooms>12)) return setError('Bedrooms must be 0–12 and bathrooms 1–12.');
    if(step===4){
      setBusy(true);
      try{
        if(demo){setEstimate(calculateQuote(demoConfig,form));}
        else {
          const resp=await fetch('/api/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,...form})});
          const data=await resp.json();if(!resp.ok) throw new Error(data.error||'Estimate unavailable.');setEstimate(data);
        }
      }catch(e){setError(e instanceof Error?e.message:'Estimate unavailable.');setBusy(false);return;}
      setBusy(false);
      if(!demo)fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'quote_completed',slug}),keepalive:true}).catch(()=>{});
    }
    setStep(a=>Math.min(a+1,6));
  }
  async function submit(e:FormEvent){
    e.preventDefault();
    const action=resolveQuoteSubmissionAction(demo,lead.consent);
    if(action==='complete-demo'){setError('');setSuccess(true);return;}
    if(action==='require-consent'){setError('Please confirm your information can be shared with this cleaning company.');return;}
    setBusy(true);setError('');
    try{
      const res=await fetch('/api/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,...form,submissionId,...lead,consent:true,website:''})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not send your request.');setNotificationPending(data.notificationPending===true);setSuccess(true);
    }catch(e){setError(e instanceof Error?e.message:'Could not send your request.');}
    finally{setBusy(false);}
  }
  const choose=<T extends string>(entries:Record<T,string>,current:T,callback:(v:T)=>void,enabled?:T[])=><div className="choice-grid">{(Object.keys(entries) as T[]).filter(k=>!enabled||enabled.includes(k)).map(k=><button key={k} type="button" className={`choice ${current===k?'selected':''}`} aria-pressed={current===k} onClick={()=>callback(k)}><span>{entries[k]}</span><span className="choice-check">{current===k?'✓':'○'}</span></button>)}</div>;
  return <div className="quote-shell">
    <div className="quote-heading"><div><div className="eyebrow">{demo?'INTERACTIVE DEMO':'FREE PRELIMINARY ESTIMATE'}</div><h1>{demo?'Try an instant cleaning quote':`Get a cleaning estimate from ${businessName}`}</h1><p>{demo?'Illustrative prices only. This demonstration does not submit any customer data.':'Find your estimated price, then send the details for a confirmed quote.'}</p></div></div>
    {demo&&<div className="demo-notice">Sample experience · All prices are fictional · No inquiry will be sent</div>}
    {success?<div className="result-panel" role="status"><span className="success-icon">✓</span><h2>{demo?'Demo complete!':'Your quote request was received.'}</h2><p>{demo?'This is what your customer sees. No real lead was submitted.':(notificationPending?'Your request was saved, but the email notification is pending delivery. Please contact the cleaning company directly if the request is urgent.':'Your details have been sent to the cleaning business for follow-up. The final price may vary.')}</p><a className="btn primary" href={demo?'/start':'/'}>{demo?'Use this for my business':'Done'}</a></div>:
    <div className="quote-card"><div className="progress-label"><strong>Step {step+1} of {STEPS.length}</strong><span>{STEPS[step]}</span></div><div className="progress-track"><div style={{width:`${(step+1)/STEPS.length*100}%`}} /></div>
      <div className="form-panel" aria-live="polite">
        {step===0&&<><h2>Where do you need cleaning?</h2><p>Enter your property's ZIP code to check service coverage.</p><label className="field">ZIP code<input autoComplete="postal-code" inputMode="numeric" maxLength={5} placeholder="e.g. 78701" value={form.zip} onChange={e=>patch({zip:e.target.value.replace(/\D/g,'')})}/></label></>}
        {step===1&&<><h2>What type of cleaning?</h2><p>Choose the service that best matches your needs.</p>{choose(SERVICES,form.service,v=>patch({service:v}),services)}</>}
        {step===2&&<><h2>Tell us about your home</h2><p>A couple of details help make the estimate more accurate.</p><div className="number-grid"><label className="field">Bedrooms<input type="number" min={0} max={12} value={form.bedrooms} onChange={e=>patch({bedrooms:Number(e.target.value)})}/></label><label className="field">Bathrooms<input type="number" min={1} max={12} value={form.bathrooms} onChange={e=>patch({bathrooms:Number(e.target.value)})}/></label></div></>}
        {step===3&&<><h2>How often?</h2><p>Recurring cleanings can have different pricing.</p>{choose(FREQ,form.frequency,v=>patch({frequency:v}))}</>}
        {step===4&&<><h2>Anything extra?</h2><p>Optional add-ons. You can skip this step.</p><div className="choice-grid">{extras.map(k=><button key={k} type="button" aria-pressed={form.extras.includes(k)} className={`choice ${form.extras.includes(k)?'selected':''}`} onClick={()=>patch({extras:form.extras.includes(k)?form.extras.filter(x=>x!==k):[...form.extras,k]})}><span>{EXTRAS[k]}</span><span className="choice-check">{form.extras.includes(k)?'✓':'+'}</span></button>)}</div></>}
        {step===5&&estimate&&<><h2>Your preliminary estimate</h2><p>Based on the information you shared.</p><div className="price-block"><div className="eyebrow">ESTIMATED RANGE</div><div className="price-value">{USD(estimate.minCents)} – {USD(estimate.maxCents)}</div><p>Final price subject to confirmation.</p></div><dl className="quote-summary"><div><dt>Service</dt><dd>{SERVICES[form.service]}</dd></div><div><dt>Home</dt><dd>{form.bedrooms} bed · {form.bathrooms} bath</dd></div><div><dt>Frequency</dt><dd>{FREQ[form.frequency]}</dd></div><div><dt>ZIP code</dt><dd>{form.zip}</dd></div><div><dt>Extras</dt><dd>{form.extras.map(x=>EXTRAS[x]).join(', ')||'None'}</dd></div></dl><p className="disclaimer">{estimate.disclaimer}</p></>}
        {step===6&&<form onSubmit={submit} id="lead-form"><h2>{demo?'See how the journey ends':'Request a confirmed quote'}</h2><p>{demo?'The demo stops here. Your information will not be saved or shared.':'We’ll send your details to the cleaning company for follow-up.'}</p>{!demo&&<><label className="field">Full name<input required maxLength={100} minLength={2} autoComplete="name" value={lead.name} onChange={e=>setLead({...lead,name:e.target.value})}/></label><label className="field">Email<input type="email" required autoComplete="email" value={lead.email} onChange={e=>setLead({...lead,email:e.target.value})}/></label><label className="field">Phone (optional)<input autoComplete="tel" type="tel" maxLength={35} value={lead.phone} onChange={e=>setLead({...lead,phone:e.target.value})}/></label><label className="check"><input type="checkbox" required checked={lead.consent} onChange={e=>setLead({...lead,consent:e.target.checked})}/><span>I agree to share these details with {businessName} so they can follow up about my cleaning quote. <a href="/privacy" target="_blank" rel="noreferrer">Privacy policy</a>.</span></label></>}<button className="btn primary wide" disabled={busy} type="submit">{busy?'Sending...':demo?'Finish Demo':'Send Quote Request →'}</button></form>}
        {error&&<p role="alert" className="error">{error}</p>}
        {step<6&&<div className="form-controls"><button className="btn subtle" disabled={step===0||busy} type="button" onClick={()=>{setStep(s=>s-1);setError('');}}>← Back</button><button className="btn primary" disabled={busy} type="button" onClick={next}>{busy?'Calculating...':step===4?'See My Estimate →':step===5?'Request a Quote →':'Continue →'}</button></div>}
        {step===6&&<button className="back-link" type="button" onClick={()=>{setStep(5);setError('');}}>← Back to estimate</button>}
      </div>
    </div>}
    <p className="quiet-foot">No payment required to request a cleaning quote. This is a preliminary estimate only.</p>
  </div>;
}
