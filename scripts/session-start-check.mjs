#!/usr/bin/env node
// SessionStart hook wrapper: runs the website monitor and emits a
// Claude Code systemMessage so the PASS/FAIL result is visible to the user
// when they open this workspace. Always exits 0 itself (regardless of the
// monitor's result) so Claude Code never reports the hook as broken —
// failure is communicated via the message text, not the hook's exit code.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const result = spawnSync(process.execPath, [path.join(__dirname, 'monitor.mjs')], {
  encoding: 'utf8',
  timeout: 45000,
});

const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
const lines = output.split('\n').filter(Boolean);
const summaryLine = lines.find((l) => l.startsWith('Summary:')) || lines.slice(-1)[0] || '(no output)';
const failureLines = lines.filter((l) => l.startsWith('  - '));

const ok = result.status === 0;
const status = ok
  ? '✅ Website monitor: all checks passed'
  : '❌ Website monitor: FAILURES detected (a report was also emailed to admin@gavriqlabsglobal.com if the contact form itself was reachable)';

const messageParts = [status, summaryLine, ...failureLines];
console.log(JSON.stringify({ systemMessage: messageParts.join('\n') }));
process.exit(0);
