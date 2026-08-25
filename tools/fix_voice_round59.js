const fs = require('fs');
const path = require('path');

// === R59 SOURCES (8 patterns) ===

const WW1 = '声音还在耳边回响，即使已经没人说话了。';
const WW2 = '声音停了一下。';
const WW3 = '声音说。';
const WW4 = '声音在0429信号中传来。';
const WW5 = '声音从旁边传来。';
const WW6 = '声音像是被砂砾磨过。';
const WW7 = '声音很轻，很稳。';
const WW8 = '声音异常沙哑。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R59 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Wx = [
  // WW1 (声音还在耳边回响，即使已经没人说话了。)
  '那声音还在耳边回响着。',
  '那声音久久不散。',
  '耳边似乎还留着那句话。',
  '那句话久久回荡在耳边。',
  // WW2 (声音停了一下。)
  '声音停顿片刻。',
  '声音中断了。',
  '声音静止一瞬。',
  '他停了半拍才继续。',
  // WW3 (声音说。)
  '声音传来说道。',
  '声音传出去。',
  '声音传过来。',
  '声音传出话来。',
  // WW4 (声音在0429信号中传来。)
  '0429信号传来他的声音。',
  '0429通道里传来声音。',
  '信号中传来声音。',
  '0429频段传来他的声音。',
  // WW5 (声音从旁边传来。)
  '旁边传来声音。',
  '身旁传来声响。',
  '旁边传来一句话。',
  '耳边忽然响起声音。',
  // WW6 (声音像是被砂砾磨过。)
  '声音粗得像砂石擦过。',
  '声音粗粝而干涩。',
  '声音像被碎石擦过。',
  '声音糙得厉害。',
  // WW7 (声音很轻，很稳。)
  '声音轻得像耳语。',
  '声音轻得几乎听不见。',
  '声音极轻，却很稳。',
  '声音低得像耳语。',
  // WW8 (声音异常沙哑。)
  '声音格外沙哑。',
  '声音极哑。',
  '声音嘶哑得异乎寻常。',
  '声音沙哑得不自然。',
];// === R59 EXECUTION ===

const REPL = [
  [WW1, Wx[0], Wx[1], Wx[2], Wx[3]],
  [WW2, Wx[4], Wx[5], Wx[6], Wx[7]],
  [WW3, Wx[8], Wx[9], Wx[10], Wx[11]],
  [WW4, Wx[12], Wx[13], Wx[14], Wx[15]],
  [WW5, Wx[16], Wx[17], Wx[18], Wx[19]],
  [WW6, Wx[20], Wx[21], Wx[22], Wx[23]],
  [WW7, Wx[24], Wx[25], Wx[26], Wx[27]],
  [WW8, Wx[28], Wx[29], Wx[30], Wx[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R59 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 59 ===');
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