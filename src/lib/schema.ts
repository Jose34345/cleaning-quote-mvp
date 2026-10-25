import { z } from 'zod';
export const quoteSchema = z.object({
  zip:z.string().regex(/^\d{5}$/),
  service:z.enum(['standard','deep','move']),
  bedrooms:z.number().int().min(0).max(12),
  bathrooms:z.number().int().min(1).max(12),
  frequency:z.enum(['once','weekly','biweekly','monthly']),
  extras:z.array(z.enum(['oven','fridge','windows'])).max(3).refine(a=>new Set(a).size===a.length),
}).strict();
export const estimateRequest = quoteSchema.extend({slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)});
export const leadRequest = estimateRequest.extend({
  submissionId:z.string().uuid(),
  name:z.string().trim().min(2).max(100),
  email:z.email().max(254),
  phone:z.string().trim().max(35).optional().default(''),
  consent:z.literal(true),
  website:z.string().max(0).optional().default(''), // honeypot
});
export const setupSchema = z.object({
  submissionId:z.string().uuid(),owner:z.string().trim().min(2).max(100),
  email:z.email().max(254),business:z.string().trim().min(2).max(120),
  website:z.union([z.url(),z.literal('')]),message:z.string().max(1000).default(''),
  website2:z.string().max(0).optional().default(''),
}).strict();
