#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const FILES = [];
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort().forEach(f => FILES.push({path: path.join(d, f), num: parseInt(f.match(/chapter-(\d+)/)[1]), vol: v}));
}

const voiceTags = [
  '0428备份说', '0428备份在说',
  '0429碎片说', '0429碎片在说',
  '0429碎片在温暖地跳动，说', '0429碎片在温暖地跳动说',
  '0428碎片在说', '0428碎片说',
];

console.log('=== Tag distribution ===');
const tagTotals = {};
for (const tag of voiceTags) {
  let t = 0;
  for (const f of FILES) {
    const text = fs.readFileSync(f.path, 'utf-8');
    t += (text.match(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }
  if (t > 0) tagTotals[tag] = t;
}
for (const [tag, cnt] of Object.entries(tagTotals)) {
  console.log('  ' + tag + ': ' + cnt);
}

// Chapters with 8+ total fragment tags (heavy chains)
console.log('\n=== Chapters with 8+ fragment tags ===');
let heavy = [];
for (const f of FILES) {
  const text = fs.readFileSync(f.path, 'utf-8');
  let chTotal = 0;
  for (const tag of voiceTags) {
    chTotal += (text.match(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }
  if (chTotal >= 8) {
    heavy.push({num: f.num, vol: f.vol, count: chTotal});
  }
}
heavy.sort((a,b) => b.count - a.count);
for (const h of heavy) {
  console.log('  ch' + h.num + ' [' + h.vol + ']: ' + h.count);
}
console.log('Heavy chapters: ' + heavy.length);