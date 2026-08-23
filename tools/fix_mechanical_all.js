#!/usr/bin/env node
/* fix_mechanical_all.js — Fix Python code, trailing content across all volumes */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const RESULTS = {
  pyRemoved: [],
  trailingRemoved: [],
  markerMixed: [],
};

for (const volDir of VOLUMES) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();

  for (const f of files) {
    const fp = path.join(d, f);
    let text = fs.readFileSync(fp, 'utf-8');
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let changed = false;

    // --- Fix 1: Python code after end marker ---
    if (text.includes('print(') || text.includes('def ') || text.includes('import ')) {
      // Find end marker, strip everything after
      const m = text.match(/（[^）]*完）/);
      if (m) {
        const before = text.slice(0, m.index + m[0].length);
        const after = text.slice(m.index + m[0].length);
        if (after.includes('print(') || after.includes('def ') || after.includes('import ')) {
          text = before + '\n';
          changed = true;
          RESULTS.pyRemoved.push(chNum);
        }
      }
    }

    // --- Fix 2: Trailing content after end marker (non-Python) ---
    if (!changed) {
      const m = text.match(/（[^）]*完）/);
      if (m) {
        const after = text.slice(m.index + m[0].length).trim();
        // Allow empty or only newlines
        if (after.length > 0 && !after.includes('（第')) {
          // Remove trailing content
          text = text.slice(0, m.index + m[0].length) + '\n';
          changed = true;
          RESULTS.trailingRemoved.push(chNum);
        }
      }
    }

    // --- Fix 3: V7 mixed marker format — check if Arabic numeral in marker ---
    if (volDir === 'volume-7') {
      const m = text.match(/（第(\d+)章完）/);
      if (m) {
        RESULTS.markerMixed.push(chNum);
      }
    }

    if (changed) {
      fs.writeFileSync(fp, text, 'utf-8');
    }
  }
}

console.log('=== Mechanical Fixes ===');
console.log('Python code removed:', RESULTS.pyRemoved.length, RESULTS.pyRemoved.join(', '));
console.log('Trailing content removed:', RESULTS.trailingRemoved.length, RESULTS.trailingRemoved.join(', '));
console.log('V7 Arabic numeral markers:', RESULTS.markerMixed.length, RESULTS.markerMixed.join(', '));