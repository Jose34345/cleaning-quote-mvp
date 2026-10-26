import { describe, it, expect } from 'vitest';
import { resolveQuoteSubmissionAction } from '../src/lib/quote-submission';

describe('quote submission: demo vs. real leads', () => {
  it('finishes demo without consent (no personal information collected)', () => {
    expect(resolveQuoteSubmissionAction(true, false)).toBe('complete-demo');
  });
  it('finishes demo even if a consent flag was set', () => {
    expect(resolveQuoteSubmissionAction(true, true)).toBe('complete-demo');
  });
  it('blocks real leads without explicit consent', () => {
    expect(resolveQuoteSubmissionAction(false, false)).toBe('require-consent');
  });
  it('permits real lead submission only with consent', () => {
    expect(resolveQuoteSubmissionAction(false, true)).toBe('submit-lead');
  });
});
