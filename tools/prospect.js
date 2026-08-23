#!/usr/bin/env node
/* prospect.js — Scan for remaining mechanical fix opportunities */

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

// Patterns to prospect
const PATTERNS = [
  {name: '。。',    rx: /。。/g,          type: 'punctuation'},
  {name: '，，',    rx: /，，/g,          type: 'punctuation'},
  {name: '………',   rx: /………/g,           type: 'ellipsis_too_long'},
  {name: '的的',    rx: /的的/g,          type: 'typo'},
  {name: '在在',    rx: /在在/g,          type: 'typo'},
  {name: '了了',    rx: /了了/g,          type: 'typo'},
  {name: '他看着他', rx: /他看着他/g,       type: 'repetition'},
  {name: '看着她',   rx: /看着她/g,         type: 'repetition'},
  {name: '看着他',   rx: /看着他/g,         type: 'repetition'},
  {name: '看着看着', rx: /看着看着/g,       type: 'repetition'},
  {name: '慢慢来',   rx: /慢慢来/g,         type: 'adverb'},
  {name: '慢慢停下', rx: /慢慢停下/g,       type: 'adverb'},
  {name: '慢慢走',   rx: /慢慢走/g,         type: 'adverb'},
  {name: '慢慢来（PAD）', rx: /有急着做出判断，因为有些东西需要慢慢来/g, type: 'pad_residue'},
  {name: '像一块石头', rx: /像一块石头，沉进了他心里最深处的那个角落/g, type: 'pad_residue'},
  {name: '不知道往哪个方向走', rx: /他站在那里，一时不知道该往哪个方向走/g, type: 'pad_residue'},
  {name: '被遗忘的记忆在挣扎', rx: /那些影子在光里晃动，像是一些被遗忘的记忆在挣扎/g, type: 'pad_residue'},
  {name: '藤蔓一样缠住', rx: /像藤蔓一样缠住了他的思绪/g, type: 'pad_residue'},
  {name: '4+ blank lines', rx: /\n{5,}/g, type: 'formatting'},
  {name: 'half-width comma in CJK', rx: /(?<=[一-鿿]),(?=[一-鿿])/g, type: 'punctuation'},
];

// Per-pattern totals
console.log('=== MECHANICAL PROSPECT ===\n');
let summary = {};
for (const p of PATTERNS) {
  let total = 0;
  let chs = [];
  for (const f of FILES) {
    const text = fs.readFileSync(f.path, 'utf-8');
    const m = text.match(p.rx);
    if (m && m.length > 0) {
      total += m.length;
      if (chs.length < 5) chs.push('ch' + f.num);
    }
  }
  summary[p.name] = total;
  if (total > 0) {
    console.log('  ' + p.name + ' [' + p.type + ']: ' + total + (chs.length ? ' (e.g. ' + chs.join(', ') + ')' : ''));
  }
}

// Paragraph density check: chapters with 3+ consecutive <30 CJK paragraphs
console.log('\n--- Paragraph density (chapters with 3+ consecutive <30 CJK paras) ---');
let shortParaChs = 0;
for (const f of FILES) {
  const text = fs.readFileSync(f.path, 'utf-8');
  const paras = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  let streak = 0, maxStreak = 0;
  for (const para of paras) {
    let cjk = 0;
    for (const c of para) if (c >= '一' && c <= '鿿') cjk++;
    if (cjk < 30 && cjk > 0) { streak++; if (streak > maxStreak) maxStreak = streak; }
    else streak = 0;
  }
  if (maxStreak >= 3) {
    shortParaChs++;
    if (shortParaChs <= 5) console.log('  ch' + f.num + ': max streak ' + maxStreak);
  }
}
console.log('  Total: ' + shortParaChs + ' chapters');

// V5-specific: 信号 + 碎片 per chapter (over-concentration)
console.log('\n--- V5 signal/fragment concentration ---');
let v5Over = 0;
for (const f of FILES) {
  if (f.vol !== 'volume-5') continue;
  const text = fs.readFileSync(f.path, 'utf-8');
  const sig = (text.match(/信号/g) || []).length;
  const frag = (text.match(/碎片/g) || []).length;
  if (sig > 15 || frag > 8) v5Over++;
}
console.log('  V5 chapters with >15 信号 or >8 碎片: ' + v5Over + '/200');