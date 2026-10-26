import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('essential deployment and source files are present', () => {
  for (const p of ['package.json', '.env.example', '.github/workflows/ci.yml',
    'src/lib/pricing/calculate-quote.ts', 'src/app/demo/page.tsx',
    'src/app/api/estimate/route.ts', 'src/app/api/quotes/route.ts',
    'src/app/api/setup-requests/route.ts', 'supabase/migrations/001_initial.sql']) {
    assert.ok(existsSync(join(root, p)), `Missing ${p}`);
  }
});

test('test/build commands and required dependencies are declared', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const key of ['build', 'typecheck', 'test']) assert.ok(pkg.scripts[key]);
  for (const key of ['next', 'react', 'zod', '@supabase/supabase-js']) assert.ok(pkg.dependencies[key]);
  assert.ok(pkg.devDependencies.vitest);
});

test('billing defaults to disabled and public variables exclude database secrets', () => {
  const env = read('.env.example');
  assert.match(env, /^BILLING_LIVE_ENABLED=false$/m);
  assert.match(env, /^SUPABASE_SECRET_KEY=$/m);
  assert.doesNotMatch(env, /^NEXT_PUBLIC_.*(?:KEY|SECRET|PASSWORD)=/m);
});

test('quote prices are recalculated server-side and demo never creates leads', () => {
  assert.match(read('src/app/api/quotes/route.ts'), /calculateQuote\(business\.pricing_config,input\)/);
  const form = read('src/components/quote-form.tsx');
  const decision = read('src/lib/quote-submission.ts');
  assert.match(form, /resolveQuoteSubmissionAction\(demo,lead\.consent\)/);
  assert.match(form, /if\(action==='complete-demo'\)\{setError\(''\);setSuccess\(true\);return;\}/);
  assert.match(form, /if\(action==='require-consent'\)\{setError\(/);
  assert.match(decision, /if \(demo\) return 'complete-demo'/);
  assert.match(decision, /return consent \? 'submit-lead' : 'require-consent'/);
});

test('privileged tenant tables are not readable using browser roles', () => {
  const sql = read('supabase/migrations/001_initial.sql');
  for (const table of ['businesses','quote_leads','setup_requests','preview_links','subscriptions']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  }
  assert.match(sql, /revoke all on public\.businesses,public\.quote_leads.* from anon,authenticated/s);
});
