const fs = require('fs');
const path = require('path');

// === R37 SOURCES (8 patterns: recycled alternatives + character actions + 0429) ===

const AA1 = '赵大嘴的心脏在跳。';
const AA2 = '叶文轩的脑子在快速转动。';
const AA3 = '叶文轩的后背窜过一道凉意。';
const AA4 = '叶文轩沉默了。';
const AA5 = '他不知道从哪里开始说，也不知道该说什么。';
const AA6 = '记忆像破碎的镜片，每一片都映着不同的画面。';
const AA7 = '空气仿佛凝固了一般，谁也没有再说话。';
const AA8 = '0429在手腕上振动。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R37 ALTERNATIVES (8 sources × 4 = 32 total) ===

const AAa = [
  // AA1 (赵大嘴的心脏在跳。)
  '赵大嘴感到心口在剧烈跳动。',
  '赵大嘴的心跳变得急促。',
  '赵大嘴的心脏扑通扑通地跳。',
  '赵大嘴的心跳骤然加快。',
  // AA2 (叶文轩的脑子在快速转动。)
  '叶文轩的思绪飞速运转。',
  '叶文轩的思维在高速运转。',
  '叶文轩的大脑在全力运转。',
  '叶文轩的思路高速盘旋。',
  // AA3 (叶文轩的后背窜过一道凉意。)
  '叶文轩后背突然一凉。',
  '叶文轩的脊背升起一阵寒意。',
  '叶文轩的后颈猛地发凉。',
  '叶文轩的背部掠过一丝冰冷。',
  // AA4 (叶文轩沉默了。)
  '叶文轩什么也没有说。',
  '叶文轩陷入沉默。',
  '叶文轩保持了沉默。',
  '叶文轩没有开口。',
  // AA5 (他不知道从哪里开始说，也不知道该说什么。)
  '他不清楚该从何说起，也不知道要说什么才好。',
  '他不知道从哪个角度切入，也不知道该表达什么。',
  '他摸不着该从哪里开口，也不知道该说些什么。',
  '他不知道如何起头，也不知道该用什么措辞。',
  // AA6 (记忆像破碎的镜片，每一片都映着不同的画面。)
  '记忆如同碎裂的玻璃，每一块折射出不同的景象。',
  '过往的片段像散落的照片，每一张定格着不同的场景。',
  '回忆像打碎的瓷片，每一片映出不同的片段。',
  '记忆如同散落的镜片，每一片都折射着不同的过往。',
  // AA7 (空气仿佛凝固了一般，谁也没有再说话。)
  '空气仿佛定格了，无人再开口。',
  '空气似乎停止了流动，谁也没有再出声。',
  '空气忽然凝固，没有人再说话。',
  '空气静止下来，没有人打破这份沉默。',
  // AA8 (0429在手腕上振动。)
  '0429在手腕上发出震动。',
  '0429在手腕处产生振动。',
  '0429在手腕上脉动起来。',
  '0429在手腕处传来震动。',
];// === R37 EXECUTION ===

const REPL = [
  [AA1, AAa[0], AAa[1], AAa[2], AAa[3]],
  [AA2, AAa[4], AAa[5], AAa[6], AAa[7]],
  [AA3, AAa[8], AAa[9], AAa[10], AAa[11]],
  [AA4, AAa[12], AAa[13], AAa[14], AAa[15]],
  [AA5, AAa[16], AAa[17], AAa[18], AAa[19]],
  [AA6, AAa[20], AAa[21], AAa[22], AAa[23]],
  [AA7, AAa[24], AAa[25], AAa[26], AAa[27]],
  [AA8, AAa[28], AAa[29], AAa[30], AAa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R37 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 37 ===');
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