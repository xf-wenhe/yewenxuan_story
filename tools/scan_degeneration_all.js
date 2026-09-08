#!/usr/bin/env node
'use strict';
// tools/scan_degeneration_all.js
// Walk chapters/ for *-polished.md, run check-degeneration.js in chunks
// (1000 files exceeds a single command line), aggregate blocking findings,
// print a per-file summary sorted by blocking count. Read-only diagnostic.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCANNER = path.resolve(__dirname, '..', '.claude', 'skills', 'story-deslop', 'scripts', 'check-degeneration.js');
const CHAPTERS_DIR = path.resolve(__dirname, '..', 'chapters');
const CHUNK = 100;

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('-polished.md')) out.push(p);
  }
  return out;
}

const files = walk(CHAPTERS_DIR, []).sort();
console.log(`Scanning ${files.length} chapter files...\n`);

const perFile = new Map();   // file -> blocking count
const allFindings = [];
let chunksFailed = 0;

for (let i = 0; i < files.length; i += CHUNK) {
  const chunk = files.slice(i, Math.min(i + CHUNK, files.length));
  let out;
  try {
    out = execFileSync('node', ['--', SCANNER, '--json', '--fail-on=blocking', ...chunk], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    // exit code 1 = blocking findings present (normal); stdout still carries JSON
    if (e.stdout) out = e.stdout;
    else { chunksFailed++; console.error(`chunk ${i} unreadable: ${e.message}`); continue; }
  }
  if (!out) continue;
  try {
    const { findings } = JSON.parse(out);
    for (const f of findings) {
      allFindings.push(f);
      perFile.set(f.file, (perFile.get(f.file) || 0) + 1);
    }
  } catch (e) {
    console.error(`chunk ${i} JSON parse failed: ${e.message}`);
  }
}

const ranked = [...perFile.entries()].sort((a, b) => b[1] - a[1]);
console.log(`=== ${ranked.length} files with blocking findings (of ${files.length} scanned) ===`);
for (const [file, count] of ranked) {
  console.log(`${String(count).padStart(4)}  ${path.relative(path.resolve(__dirname, '..'), file)}`);
}
console.log(`\nTotal blocking findings: ${allFindings.length}`);
if (chunksFailed) console.log(`Chunks failed: ${chunksFailed}`);
