#!/usr/bin/env node
// Captures the current live content of each monitored page as the accepted
// baseline for scripts/monitor.mjs's content-integrity check.
//
// Run this deliberately whenever you ship a real content change to one of
// these pages, then commit the updated scripts/baseline.json. If you don't,
// the next monitor run will report a content-integrity failure for that page
// (which is the correct behaviour for an *unexpected* change, but a false
// alarm for one you meant to make).
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://gavriqlabsglobal.com';
const PAGES = ['/', '/what-we-do', '/about', '/contact', '/privacy', '/terms', '/cookies', '/security', '/accessibility'];

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function main() {
  const pages = {};
  for (const p of PAGES) {
    const res = await fetch(BASE_URL + p);
    if (res.status !== 200) {
      console.error(`WARNING: ${p} returned status ${res.status} while capturing baseline`);
    }
    const body = await res.text();
    pages[p] = sha256(body);
    console.log(`captured ${p} -> ${pages[p].slice(0, 12)}...`);
  }
  const baseline = { capturedAt: new Date().toISOString(), pages };
  writeFileSync(path.join(__dirname, 'baseline.json'), JSON.stringify(baseline, null, 2) + '\n');
  console.log('Wrote scripts/baseline.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
