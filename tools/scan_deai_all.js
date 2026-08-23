#!/usr/bin/env node
/* scan_deai_all.js — Scan all volumes for de-AI banned words */

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

const PATTERNS = {
  '能感觉到': { type: 'structural', severity: 'high' },
  '的心脏在跳': { type: 'structural', severity: 'high' },
  '他知道': { type: 'deadly', severity: 'high' },
  '不禁': { type: 'l1', severity: 'medium' },
  '缓缓': { type: 'l1', severity: 'medium' },
  '微微': { type: 'l1', severity: 'medium' },
  '轻轻': { type: 'l1', severity: 'medium' },
  '淡淡': { type: 'l1', severity: 'medium' },
  '仿佛': { type: 'l1', severity: 'medium' },
  '深吸一口气': { type: 'l1', severity: 'medium' },
  '眼中闪过': { type: 'l1', severity: 'medium' },
  '嘴角勾起': { type: 'l1', severity: 'medium' },
  '心中暗道': { type: 'l1', severity: 'medium' },
  '不由自主': { type: 'l1', severity: 'medium' },
  '情不自禁': { type: 'l1', severity: 'medium' },
};

const results = {};
let grandTotal = 0;

for (const [volDir, vol] of Object.entries(VOLUMES)) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) { console.log(volDir + ' NOT FOUND'); continue; }
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();

  const counts = {};
  for (const p of Object.keys(PATTERNS)) counts[p] = 0;
  let totalCjk = 0;
  let below3000 = 0;
  let missingMarker = 0;
  let wrongMarker = 0;

  for (const f of files) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let cjk = 0;
    for (const c of text) if (c >= '一' && c <= '鿿') cjk++;
    totalCjk += cjk;
    if (cjk < 3000) below3000++;

    if (!text.includes('（第' + chNum + '章完）')) {
      // Check if any marker exists
      if (!text.match(/（第[^）]*章完）/)) missingMarker++;
      else wrongMarker++;
    }

    for (const p of Object.keys(PATTERNS)) {
      const regex = new RegExp(p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g');
      counts[p] += (text.match(regex) || []).length;
    }
  }

  results[vol.label] = { files: files.length, cjk: totalCjk, counts, below3000, missingMarker, wrongMarker };
  grandTotal += totalCjk;
}

console.log('=== FULL LIBRARY DE-AI SCAN ===\n');
console.log('Volume | Ch | CJK | 能感觉到 | 心脏在跳 | 他知道 | 不禁 | 缓缓 | 微微 | 轻轻 | 淡淡 | 仿佛 | 深吸气 | 眼中闪过 | 嘴角勾起 | 心中暗道 | 不由自主 | 情不自禁 | <3k | 缺标记 | 错标记');
console.log('-'.repeat(170));

const grandCounts = {};
for (const p of Object.keys(PATTERNS)) grandCounts[p] = 0;

for (const vol of ['V1','V2','V3','V4','V5','V6','V7']) {
  const r = results[vol];
  if (!r) continue;
  const c = r.counts;
  console.log(vol.padEnd(4) + ' | ' + String(r.files).padStart(3) + ' | ' +
    String(r.cjk).padStart(7).replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    ' | ' + String(c['能感觉到']).padStart(6) +
    ' | ' + String(c['的心脏在跳']).padStart(6) +
    ' | ' + String(c['他知道']).padStart(5) +
    ' | ' + String(c['不禁']).padStart(4) +
    ' | ' + String(c['缓缓']).padStart(4) +
    ' | ' + String(c['微微']).padStart(4) +
    ' | ' + String(c['轻轻']).padStart(4) +
    ' | ' + String(c['淡淡']).padStart(4) +
    ' | ' + String(c['仿佛']).padStart(4) +
    ' | ' + String(c['深吸一口气']).padStart(5) +
    ' | ' + String(c['眼中闪过']).padStart(5) +
    ' | ' + String(c['嘴角勾起']).padStart(5) +
    ' | ' + String(c['心中暗道']).padStart(5) +
    ' | ' + String(c['不由自主']).padStart(5) +
    ' | ' + String(c['情不自禁']).padStart(5) +
    ' | ' + String(r.below3000).padStart(3) +
    ' | ' + String(r.missingMarker).padStart(4) +
    ' | ' + String(r.wrongMarker).padStart(4));

  for (const p of Object.keys(PATTERNS)) grandCounts[p] += c[p];
}

console.log('\n=== GRAND TOTALS ===');
console.log('Total CJK:', grandTotal.toLocaleString());
for (const [p, count] of Object.entries(grandCounts).sort((a,b) => b[1]-a[1])) {
  if (count > 0) console.log('  ' + p + ': ' + count);
}