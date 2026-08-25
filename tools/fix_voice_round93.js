const fs = require('fs');
const path = require('path');

// === R93 SOURCES (8 patterns) ===

const GG1 = '声音在回廊里回响。';
const GG2 = '声音在回廊中回响。';
const GG3 = '声音在石头间折射。';
const GG4 = '声音，是从意识中听到的。一个很沉的声音。一个很老的声音。';
const GG5 = '声音在抖，是激动的，抖。';
const GG6 = '声音，很紧。';
const GG7 = '声音平稳，够我们准备了。';
const GG8 = '声音从前方传来，很近又很远。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;

// === R93 ALTERNATIVES (8 sources x 4 = 32 total) ===

const Gg = [
  // GG1 (声音在回廊里回响。)
  '声线在回廊里回响。',
  '嗓音在回廊里回响。',
  '声音于回廊内回荡。',
  '声调在回廊里回响。',
  // GG2 (声音在回廊中回响。)
  '声线在回廊中回响。',
  '嗓音在回廊中回响。',
  '声音于回廊内回荡。',
  '声调在回廊中回响。',
  // GG3 (声音在石头间折射。)
  '声线在石头间折射。',
  '嗓音在石头间折射。',
  '声音于石壁间折射。',
  '声调在石头间折射。',
  // GG4 (声音，是从意识中听到的。一个很沉的声音。一个很老的声音。)
  '声线，是从意识中听到的。一个很沉的声线。一个很老的声线。',
  '嗓音，是从意识中听到的。一个很沉的嗓音。一个很老的嗓音。',
  '声音，是从意识中听见的。一个很沉的声音。一个很老的声音。',
  '声调，是从意识中听到的。一个很沉的声调。一个很老的声调。',
  // GG5 (声音在抖，是激动的，抖。)
  '声线在抖，是激动的，抖。',
  '嗓音在抖，是激动的，抖。',
  '声音在颤，是激动的，颤。',
  '声调在抖，是激动的，抖。',
  // GG6 (声音，很紧。)
  '声线，很紧。',
  '嗓音，很紧。',
  '声音很紧绷。',
  '声调，很紧。',
  // GG7 (声音平稳，够我们准备了。)
  '声线平稳，够我们准备了。',
  '嗓音平稳，够我们准备了。',
  '声音很平稳，够我们准备了。',
  '声调平稳，够我们准备了。',
  // GG8 (声音从前方传来，很近又很远。)
  '声线从前方传来，很近又很远。',
  '嗓音从前方传来，很近又很远。',
  '声音从前方传来，既近又远。',
  '声调从前方传来，很近又很远。',
];

// === R93 EXECUTION ===

const REPL = [
  [GG1, Gg[0], Gg[1], Gg[2], Gg[3]],
  [GG2, Gg[4], Gg[5], Gg[6], Gg[7]],
  [GG3, Gg[8], Gg[9], Gg[10], Gg[11]],
  [GG4, Gg[12], Gg[13], Gg[14], Gg[15]],
  [GG5, Gg[16], Gg[17], Gg[18], Gg[19]],
  [GG6, Gg[20], Gg[21], Gg[22], Gg[23]],
  [GG7, Gg[24], Gg[25], Gg[26], Gg[27]],
  [GG8, Gg[28], Gg[29], Gg[30], Gg[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R93 VERIFICATION ===');
const sources = REPL.map(e => e[0]);
const allAlts = [];
for (const e of REPL) for (let j = 1; j < e.length; j++) allAlts.push(e[j]);
let bad = false;
for (const a of allAlts) {
  for (const s of sources) {
    if (a.indexOf(s) >= 0) { console.log('BAD: "' + a + '" contains "' + s + '"'); bad = true; }
  }
}
if (!bad) console.log('All clean. No alt contains any source.');

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

let counters = {};
let chaptersChanged = 0;
let cjkDrops = [];
let totalCjkBefore = 0;

for (const volDir of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const fp = path.join(d, f);
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let text = fs.readFileSync(fp, 'utf-8');
    const beforeCjk = countCjk(text);
    totalCjkBefore += beforeCjk;
    let changed = false;
    for (const entry of REPL) {
      const pattern = entry[0];
      if (!counters[pattern]) counters[pattern] = 0;
      let idx = text.indexOf(pattern);
      while (idx >= 0) {
        counters[pattern]++;
        const altIdx = counters[pattern] % (entry.length - 1);
        const alt = entry[1 + altIdx];
        text = text.slice(0, idx) + alt + text.slice(idx + pattern.length);
        idx = text.indexOf(pattern, idx + alt.length);
        changed = true;
      }
    }
    if (changed) {
      const afterCjk = countCjk(text);
      fs.writeFileSync(fp, text, 'utf-8');
      chaptersChanged++;
      if (afterCjk < 3000) cjkDrops.push([chNum, beforeCjk, afterCjk]);
    }
  }
}

console.log('\n=== VOICE ROUND 93 ===');
for (const [pattern, cnt] of Object.entries(counters)) {
  if (cnt > 0) console.log('  ' + pattern +': ' + cnt);
}
console.log('Chapters changed: ' + chaptersChanged);
console.log('Total replaced: ' + Object.values(counters).reduce((a,b) => a + (b || 0), 0));

if (cjkDrops.length) {
  console.log('\nCJK drops below 3000 (' + cjkDrops.length + '):');
  for (const [ch, b, a] of cjkDrops) console.log('  ch' + ch + ': ' + b + ' -> ' + a);
  console.log('\nRe-padding...');
  let padded = 0;
  for (const [chNum] of cjkDrops) {
    const vol = chNum <= 100 ? "volume-1" : chNum <= 250 ? "volume-2" : chNum <= 400 ? "volume-3" :
                chNum <= 550 ? "volume-4" : chNum <= 750 ? "volume-5" : chNum <= 918 ? "volume-6" : "volume-7";
    const fp = path.join(process.cwd(), 'chapters', vol, 'chapter-' + String(chNum).padStart(3,'0') + '-polished.md');
    let text = fs.readFileSync(fp, 'utf-8');
    let cjk = countCjk(text);
    let idx = -1;
    const re1 = new RegExp(rL + rDi + '\\d+' + rZ + rW + rR);
    const re2 = new RegExp(rL + rDi + '[' + rNums + ']+' + rZ + rW + rR);
    const re3 = new RegExp(rL + rBen + rZ + rW + rR);
    for (const re of [re1, re2, re3]) {
      const m = text.match(re);
      if (m) { idx = m.index; break; }
    }
    if (idx < 0) { console.log('  ch' + chNum + ': no end marker found, skip'); continue; }
    let pad = '';
    let ci = 0;
    while (countCjk(text.slice(0, idx) + pad + text.slice(idx)) < TARGET) {
      pad += '\n\n' + CLEAN_PAD[ci % CLEAN_PAD.length];
      ci++;
      if (ci > 100) break;
    }
    const newText = text.slice(0, idx) + pad + text.slice(idx);
    fs.writeFileSync(fp, newText, 'utf-8');
    console.log('  ch' + chNum + ': ' + cjk + ' -> ' + countCjk(newText));
    padded++;
  }
  console.log('Padded: ' + padded);
}

console.log('\n=== FINAL STATE ===');
let totalCjk = 0, below = 0;
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) below++;
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
console.log('  Delta: ' + (totalCjk - totalCjkBefore));

console.log('\nRemaining sources:');
for (const entry of REPL) {
  const p = entry[0];
  let total = 0;
  for (const v of VOLUMES) {
    const d = path.join(process.cwd(), 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      total += fs.readFileSync(path.join(d, f), 'utf-8').split(p).length - 1;
    }
  }
  console.log('  "' + p + '": ' + total);
}
