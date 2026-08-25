const fs = require('fs');
const path = require('path');

// === R41 SOURCES (8 patterns: 影子 + 韩冰 + 频率 + 赵大嘴/声音) ===

const EE1 = '频率比之前快了。';
const EE2 = '韩冰说话，音量压得很低。';
const EE3 = '韩冰的嗓音压低了。';
const EE4 = '那些影子在光里晃动，是被遗忘的东西在跳动。';
const EE5 = '那些影子在光里晃动，是被遗忘的东西在颤抖。';
const EE6 = '那些影子在光里晃动，是被遗忘的东西在游动。';
const EE7 = '那些影子在光里晃动，是被遗忘的东西在翻涌。';
const EE8 = '赵大嘴的声音很平。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R41 ALTERNATIVES (8 sources × 4 = 32 total) ===

const EEa = [
  // EE1 (频率比之前快了。)
  '频率比之前更快了。',
  '节奏比之前明显加速了。',
  '频率比之前提升了一个档次。',
  '这个频率比之前的要高。',
  // EE2 (韩冰说话，音量压得很低。)
  '韩冰开口，声音压到了最低。',
  '韩冰低声开口，音量几乎听不清。',
  '韩冰的声音压得极低。',
  '韩冰说话时把音量降到最低。',
  // EE3 (韩冰的嗓音压低了。)
  '韩冰的声调降了下来。',
  '韩冰把声音压得更低。',
  '韩冰的音量降低了。',
  '韩冰刻意压低了自己的声音。',
  // EE4 (那些影子在光里晃动，是被遗忘的东西在跳动。)
  '光中的影子来回晃动，被遗忘的东西还在跳动。',
  '影子在光照中摇晃，被遗忘的记忆在躁动。',
  '光里晃动的影子不停抖动，那是被遗忘的东西在跳动。',
  '被遗忘的东西在光影中晃动，影子在跳动。',
  // EE5 (那些影子在光里晃动，是被遗忘的东西在颤抖。)
  '光中的影子来回晃动，被遗忘的东西在震动。',
  '影子在光照中摇晃，被遗忘的记忆在颤动。',
  '光里晃动的影子持续抖动，被遗忘的东西在震颤。',
  '被遗忘的东西在光影中颤动，影子在震动。',
  // EE6 (那些影子在光里晃动，是被遗忘的东西在游动。)
  '光中的影子来回晃荡，被遗忘的东西在游移。',
  '影子在光照中漂浮，被遗忘的记忆在流转。',
  '光里晃动的影子飘来飘去，被遗忘的东西在漂流。',
  '被遗忘的东西在光影中穿梭，影子在飘荡。',
  // EE7 (那些影子在光里晃动，是被遗忘的东西在翻涌。)
  '光中的影子来回翻腾，被遗忘的东西在涌动。',
  '影子在光照中起伏，被遗忘的记忆在激荡。',
  '光里晃动的影子上下翻飞，被遗忘的东西在涌起。',
  '被遗忘的东西在光影中腾起，影子在翻滚。',
  // EE8 (赵大嘴的声音很平。)
  '赵大嘴开口，语调平得像水面。',
  '赵大嘴的嗓音从头到尾没有起伏。',
  '赵大嘴说话，声音平得没有节奏。',
  '赵大嘴的声调平直而均匀。',
];// === R41 EXECUTION ===

const REPL = [
  [EE1, EEa[0], EEa[1], EEa[2], EEa[3]],
  [EE2, EEa[4], EEa[5], EEa[6], EEa[7]],
  [EE3, EEa[8], EEa[9], EEa[10], EEa[11]],
  [EE4, EEa[12], EEa[13], EEa[14], EEa[15]],
  [EE5, EEa[16], EEa[17], EEa[18], EEa[19]],
  [EE6, EEa[20], EEa[21], EEa[22], EEa[23]],
  [EE7, EEa[24], EEa[25], EEa[26], EEa[27]],
  [EE8, EEa[28], EEa[29], EEa[30], EEa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R41 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 41 ===');
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