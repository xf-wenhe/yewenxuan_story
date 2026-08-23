#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

// Check what "深吸" occurrences remain
const patterns = ['深吸', '嘴角浮起', '一种沉重的', '嘴角牵了下', '嘴角扯了下'];
for (const p of patterns) {
  console.log('\n=== ' + p + ' ===');
  for (const v of VOLUMES) {
    const d = path.join(baseDir, 'chapters', v);
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
    for (const f of files) {
      const text = fs.readFileSync(path.join(d, f), 'utf-8');
      const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
      let idx = text.indexOf(p);
      while (idx >= 0) {
        const start = Math.max(0, idx - 15);
        const end = Math.min(text.length, idx + p.length + 20);
        console.log('  ch' + chNum + ': ...' + text.slice(start, end) + '...');
        idx = text.indexOf(p, idx + p.length);
      }
    }
  }
}
