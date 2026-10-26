/**
 * Quote demo is non-collecting: it must always finish without lead consent.
 * Live submissions still require the customer's explicit permission.
 */
export type QuoteSubmissionAction = 'complete-demo' | 'require-consent' | 'submit-lead';

export function resolveQuoteSubmissionAction(demo: boolean, consent: boolean): QuoteSubmissionAction {
  if (demo) return 'complete-demo';
  return consent ? 'submit-lead' : 'require-consent';
}
