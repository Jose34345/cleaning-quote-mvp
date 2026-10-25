import type { PricingConfig } from './calculate-quote';
/** Completely fictional fixture. Never used for a customer business. */
export const DEMO_CONFIG: PricingConfig = {
  currency:'USD', serviceBaseCents:{standard:9000,deep:16000,move:20000},
  bedroomCents:1800,bathroomCents:2400,
  extrasCents:{oven:2500,fridge:2000,windows:3000},
  frequencyPermille:{once:1000,weekly:850,biweekly:900,monthly:950},
  minimumCents:10000,rangePercent:10,
  disclaimer:'Illustrative estimate only. Final prices are set and confirmed by the cleaning company.'
};
