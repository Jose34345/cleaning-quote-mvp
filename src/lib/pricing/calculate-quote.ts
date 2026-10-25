/** Money stays in integer cents; multipliers are integer thousandths. No floating money inputs. */
export type Service = 'standard' | 'deep' | 'move';
export type Frequency = 'once' | 'weekly' | 'biweekly' | 'monthly';
export type Extra = 'oven' | 'fridge' | 'windows';
export type QuoteInput = {
  zip: string; service: Service; bedrooms: number; bathrooms: number;
  frequency: Frequency; extras: Extra[];
};
export type PricingConfig = {
  currency: 'USD'; serviceBaseCents: Partial<Record<Service, number>>;
  bedroomCents: number; bathroomCents: number;
  extrasCents: Partial<Record<Extra, number>>;
  frequencyPermille: Record<Frequency, number>;
  minimumCents: number; maximumCents?: number;
  rangePercent: number; allowedZips?: string[];
  disclaimer: string;
};
export class QuoteError extends Error {
  constructor(public code: 'INVALID_INPUT' | 'SERVICE_UNAVAILABLE' | 'OUTSIDE_SERVICE_AREA' | 'EXTRA_UNAVAILABLE', message: string) { super(message); }
}
const OWN = Object.prototype.hasOwnProperty;
function nonNegativeCents(n: number | undefined): n is number { return Number.isSafeInteger(n) && n! >= 0; }
/** Validate configs at the trust boundary (JSONB, scripts, deployment). */
export function validatePricingConfig(config: PricingConfig) {
  if(config.currency !== 'USD' || !config.serviceBaseCents || !config.extrasCents || !config.frequencyPermille) throw new Error('Invalid pricing configuration');
  for(const v of Object.values(config.serviceBaseCents)) if(!nonNegativeCents(v)) throw new Error('Invalid service price');
  for(const v of Object.values(config.extrasCents)) if(!nonNegativeCents(v)) throw new Error('Invalid extra price');
  for(const f of ['once','weekly','biweekly','monthly'] as const) if(!Number.isInteger(config.frequencyPermille[f]) || config.frequencyPermille[f]<100 || config.frequencyPermille[f]>3000) throw new Error('Invalid frequency multiplier');
  if(!nonNegativeCents(config.bedroomCents) || !nonNegativeCents(config.bathroomCents) || !nonNegativeCents(config.minimumCents) || (config.maximumCents!==undefined && (!nonNegativeCents(config.maximumCents) || config.maximumCents<config.minimumCents))) throw new Error('Invalid price bounds');
  if(!Number.isInteger(config.rangePercent) || config.rangePercent<0 || config.rangePercent>50) throw new Error('Invalid estimate range');
  if(config.allowedZips && (!Array.isArray(config.allowedZips)|| config.allowedZips.some(z=>!/^\d{5}$/.test(z)))) throw new Error('Invalid service ZIP allowlist');
  if(typeof config.disclaimer !== 'string' || config.disclaimer.length<10) throw new Error('Missing disclaimer');
}
export function calculateQuote(config: PricingConfig, input: QuoteInput) {
  validatePricingConfig(config);
  if(!/^\d{5}$/.test(input.zip) || !Number.isInteger(input.bedrooms) || input.bedrooms<0 || input.bedrooms>12 || !Number.isInteger(input.bathrooms) || input.bathrooms<1 || input.bathrooms>12 || !Array.isArray(input.extras) || input.extras.length>3 || new Set(input.extras).size!==input.extras.length) throw new QuoteError('INVALID_INPUT', 'Please check your property details.');
  if(config.allowedZips && !config.allowedZips.includes(input.zip)) throw new QuoteError('OUTSIDE_SERVICE_AREA', 'This ZIP code is outside our current service area.');
  if(!OWN.call(config.serviceBaseCents,input.service) || !nonNegativeCents(config.serviceBaseCents[input.service])) throw new QuoteError('SERVICE_UNAVAILABLE', 'This cleaning service is not available.');
  if(!OWN.call(config.frequencyPermille,input.frequency)) throw new QuoteError('INVALID_INPUT', 'Choose a valid cleaning frequency.');
  let extras = 0;
  for(const e of input.extras) {
    if(!OWN.call(config.extrasCents,e) || !nonNegativeCents(config.extrasCents[e])) throw new QuoteError('EXTRA_UNAVAILABLE', 'One selected extra is unavailable.');
    extras += config.extrasCents[e]!;
  }
  const subtotalCents = config.serviceBaseCents[input.service]! + input.bedrooms*config.bedroomCents + input.bathrooms*config.bathroomCents + extras;
  const adjustedCents = Math.round(subtotalCents*config.frequencyPermille[input.frequency]/1000);
  const centerCents = Math.min(config.maximumCents ?? Infinity,Math.max(config.minimumCents,adjustedCents));
  const minCents = Math.max(config.minimumCents, Math.round(centerCents*(100-config.rangePercent)/100));
  const maxCents = Math.min(config.maximumCents ?? Infinity,Math.max(minCents, Math.round(centerCents*(100+config.rangePercent)/100)));
  if(![subtotalCents,adjustedCents,centerCents,minCents,maxCents].every(Number.isSafeInteger)) throw new QuoteError('INVALID_INPUT','Price exceeds supported bounds.');
  return {minCents,maxCents,centerCents,currency:'USD' as const,disclaimer:config.disclaimer};
}
export const USD = (cents:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(cents/100);
