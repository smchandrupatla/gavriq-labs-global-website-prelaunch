#!/usr/bin/env node
// Daily/on-demand health check for gavriqlabsglobal.com.
//
// Checks, in order:
//   1. Availability      — each key page returns 200; a bogus path returns 404
//      (via the branded 404 page); security.txt is reachable.
//   2. Security headers   — spot-checks that X-Content-Type-Options and
//      X-Frame-Options weren't accidentally dropped from a future deploy.
//   3. Content integrity  — each page's byte content still matches
//      scripts/baseline.json. A mismatch means the live content changed
//      since the baseline was captured — either a deliberate edit (re-run
//      capture-baseline.mjs and commit it) or something unexpected.
//   4. Contact form       — validation (missing fields -> 400) and the
//      honeypot path (-> 200 ok:true, no email sent) run every time, cheap
//      and side-effect-free. A real end-to-end submission through Resend
//      runs once per day (always in CI; locally, only once per calendar day
//      per machine, tracked in scripts/.monitor-state.json) — this is the
//      only check that can catch a revoked/expired Resend API key, and it
//      doubles as the "everything's fine" or "N checks failed" email report.
//
// On failure, the results (including any that failed) are emailed to
// admin@gavriqlabsglobal.com through the site's own contact form endpoint,
// so no extra secret or delivery channel is needed here. If the contact form
// itself is what's broken, that alert can't be sent — this script still
// exits non-zero so CI marks the run failed (GitHub's own failed-scheduled-
// workflow notification is the fallback in that case).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://gavriqlabsglobal.com';
const BASELINE_PATH = path.join(__dirname, 'baseline.json');
const STATE_PATH = path.join(__dirname, '.monitor-state.json');

const PAGES = ['/', '/privacy', '/terms', '/cookies', '/security', '/accessibility'];
const NOT_FOUND_PATH = '/this-page-should-not-exist-monitor-check';
const SECURITY_TXT_PATH = '/.well-known/security.txt';

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function fetchPage(pathname) {
  const res = await fetch(BASE_URL + pathname, { redirect: 'manual' });
  const body = await res.text();
  return { res, body };
}

async function checkAvailabilityAndContent(baseline) {
  for (const p of PAGES) {
    try {
      const { res, body } = await fetchPage(p);
      record(`availability: ${p}`, res.status === 200, `status=${res.status}`);

      const hash = sha256(body);
      const expected = baseline.pages?.[p];
      if (expected === undefined) {
        record(`content-integrity: ${p}`, false, 'no baseline recorded — run scripts/capture-baseline.mjs');
      } else {
        record(`content-integrity: ${p}`, hash === expected, hash === expected ? undefined : 'live content no longer matches baseline.json (unexpected change — or run capture-baseline.mjs if this was deliberate)');
      }
    } catch (err) {
      record(`availability: ${p}`, false, String(err));
    }
  }

  try {
    const { res, body } = await fetchPage(SECURITY_TXT_PATH);
    record('availability: security.txt', res.status === 200 && body.includes('admin@gavriqlabsglobal.com'), `status=${res.status}`);
  } catch (err) {
    record('availability: security.txt', false, String(err));
  }

  try {
    const { res, body } = await fetchPage(NOT_FOUND_PATH);
    record('404 handling (branded page)', res.status === 404 && /404/i.test(body), `status=${res.status}`);
  } catch (err) {
    record('404 handling (branded page)', false, String(err));
  }

  try {
    const { res } = await fetchPage('/');
    const nosniff = res.headers.get('x-content-type-options') === 'nosniff';
    const frameDeny = res.headers.get('x-frame-options') === 'DENY';
    record('security headers present', nosniff && frameDeny, `nosniff=${nosniff} frame-options-deny=${frameDeny}`);
  } catch (err) {
    record('security headers present', false, String(err));
  }
}

async function checkContactFormValidation() {
  try {
    const res = await fetch(BASE_URL + '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing-fields@example.com' }),
    });
    const json = await res.json().catch(() => null);
    record('contact form: rejects incomplete submission', res.status === 400 && json?.ok === false, `status=${res.status}`);
  } catch (err) {
    record('contact form: rejects incomplete submission', false, String(err));
  }

  try {
    const res = await fetch(BASE_URL + '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Monitor Bot Check',
        email: 'bot@example.com',
        message: 'automated honeypot check',
        company_website: 'http://spam.example',
      }),
    });
    const json = await res.json().catch(() => null);
    record('contact form: honeypot short-circuits silently', res.status === 200 && json?.ok === true, `status=${res.status}`);
  } catch (err) {
    record('contact form: honeypot short-circuits silently', false, String(err));
  }
}

function loadState() {
  if (!existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

async function sendReport(failuresBeforeSend) {
  const timestamp = new Date().toISOString();
  const name = failuresBeforeSend.length === 0
    ? 'Automated Daily Health Check — all checks passed'
    : `Website Monitor ALERT — ${failuresBeforeSend.length} check(s) failed`;

  const lines = [`Automated website monitor report — ${timestamp}`, ''];
  if (failuresBeforeSend.length) {
    lines.push('Failed checks:');
    for (const f of failuresBeforeSend) lines.push(`- ${f.name}${f.detail ? ' :: ' + f.detail : ''}`);
    lines.push('');
  }
  lines.push('All results so far:');
  for (const r of results) lines.push(`${r.pass ? '[PASS]' : '[FAIL]'} ${r.name}${r.detail ? ' :: ' + r.detail : ''}`);
  lines.push('', 'This is an automated message from the website monitoring routine (scripts/monitor.mjs). No reply needed.');

  try {
    const res = await fetch(BASE_URL + '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: 'admin@gavriqlabsglobal.com',
        organisation: 'GAVRIQ Labs Global — Automated Monitoring',
        message: lines.join('\n'),
      }),
    });
    const json = await res.json().catch(() => null);
    record('contact form: end-to-end send (report email)', res.status === 200 && json?.ok === true, `status=${res.status}`);
  } catch (err) {
    record('contact form: end-to-end send (report email)', false, String(err));
  }
}

async function main() {
  if (!existsSync(BASELINE_PATH)) {
    console.error('No baseline.json found. Run: node scripts/capture-baseline.mjs');
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));

  await checkAvailabilityAndContent(baseline);
  await checkContactFormValidation();

  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const today = new Date().toISOString().slice(0, 10);
  const state = loadState();
  const alreadySentToday = !isCI && state.lastRealSendDate === today;

  if (alreadySentToday) {
    console.log(`SKIP - contact form: end-to-end send (already verified today, ${state.lastRealSendDate})`);
  } else {
    const failuresSoFar = results.filter((r) => !r.pass);
    await sendReport(failuresSoFar);
    if (!isCI) {
      state.lastRealSendDate = today;
      saveState(state);
    }
  }

  const failures = results.filter((r) => !r.pass);
  console.log('');
  console.log(`Summary: ${results.length - failures.length}/${results.length} checks passed.`);
  if (failures.length) {
    console.log('FAILURES:');
    failures.forEach((f) => console.log(`  - ${f.name}${f.detail ? ': ' + f.detail : ''}`));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Monitor crashed:', err);
  process.exit(1);
});
