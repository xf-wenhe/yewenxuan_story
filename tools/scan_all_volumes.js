#!/usr/bin/env node
/* scan_all_volumes.js — Full library AI pattern scan across all volumes */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();

const VOLUMES = {
  'volume-1': { label: 'V1', range: [1, 100] },
  'volume-2': { label: 'V2', range: [101, 250] },
  'volume-3': { label: 'V3', range: [251, 400] },
  'volume-4': { label: 'V4', range: [401, 550] },
  'volume-5': { label: 'V5', range: [551, 750] },
  'volume-6': { label: 'V6', range: [751, 918] },
  'volume-7': { label: 'V7', range: [919, 1000] },
};

const PATTERNS = ['能感觉到', '的心脏在跳', '他知道', '不禁', '缓缓', '微微', '轻轻', '淡淡', '仿佛'];

const results = {};
for (const [volDir, vol] of Object.entries(VOLUMES)) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) { console.log(volDir + ' NOT FOUND'); continue; }

  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();

  let totalCjk = 0;
  let counts = {};
  for (const p of PATTERNS) counts[p] = 0;
  let below3000 = 0;
  let missingMarker = 0;
  let trailing = 0;
  let pyCode = 0;

  for (const f of files) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);

    let cjk = 0;
    for (const c of text) if (c >= '一' && c <= '鿿') cjk++;
    totalCjk += cjk;
    if (cjk < 3000) below3000++;

    for (const p of PATTERNS) {
      counts[p] += (text.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g')) || []).length;
    }

    if (!text.includes('（第' + chNum + '章完）')) missingMarker++;
    const m = text.match(/（第\d+章完）/);
    if (m && text.slice(m.index + m[0].length).trim().length > 0) trailing++;
    if (text.includes('print(') || text.includes('def ')) pyCode++;
  }

  results[vol.label] = { files: files.length, cjk: totalCjk, counts, below3000, missingMarker, trailing, pyCode };
}

console.log('=== FULL LIBRARY SCAN ===\n');
console.log('Volume | Chapters | CJK | 能感觉到 | 的心脏在跳 | 他知道 | 不禁 | 缓缓 | 微微 | 轻轻 | 淡淡 | 仿佛 | <3k | 缺标记 | 残留 | py');
console.log('-'.repeat(140));
for (const vol of ['V1','V2','V3','V4','V5','V6','V7']) {
  const r = results[vol];
  if (!r) continue;
  const c = r.counts;
  console.log(vol + ' | ' + String(r.files).padStart(8) + ' | ' + String(r.cjk).padStart(7).replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    ' | ' + String(c['能感觉到']).padStart(7) + ' | ' + String(c['的心脏在跳']).padStart(8) +
    ' | ' + String(c['他知道']).padStart(5) + ' | ' + String(c['不禁']).padStart(4) +
    ' | ' + String(c['缓缓']).padStart(4) + ' | ' + String(c['微微']).padStart(4) +
    ' | ' + String(c['轻轻']).padStart(4) + ' | ' + String(c['淡淡']).padStart(4) +
    ' | ' + String(c['仿佛']).padStart(4) +
    ' | ' + String(r.below3000).padStart(3) + ' | ' + String(r.missingMarker).padStart(4) +
    ' | ' + String(r.trailing).padStart(4) + ' | ' + String(r.pyCode).padStart(3));
}