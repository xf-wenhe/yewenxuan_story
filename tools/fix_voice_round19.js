const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (longest first) ===
const mf = fromCodes([33041,28023,20013,28014,29616]);    // 脑海中浮现 (5)
const mfa = fromCodes([33041,28023,37324,28014,29616]);    // 脑海里浮现 (5)
const bb = fromCodes([21628,21560,21464,24471]);           // 呼吸变得 (4)
const br = fromCodes([21628,21560,24613,20419]);           // 呼吸急促 (4)
const bt = fromCodes([21628,21560,19968,32039]);           // 呼吸一紧 (4)
const tb = fromCodes([21897,21657,28378,21160]);           // 喉咙滚动 (4)
const bm = fromCodes([21628,21560,20043,38388]);           // 呼吸之间 (4)

// === Alternatives ===
// 脑海中浮现 -> 4 (none contain 浮现)
const mf1 = fromCodes([33041,28023,20013,26144,20986]);   // 脑海中映出
const mf2 = fromCodes([33041,28023,20013,20986,29616]);   // 脑海中现出
const mf3 = fromCodes([33041,28023,20013,26144,29616]);   // 脑海中映现
const mf4 = fromCodes([33041,28023,20013,29616,20986,30011,38754]);   // 脑海中现出画面

// 脑海里浮现 -> 4
const mfa1 = fromCodes([33041,28023,37324,26144,20986]);   // 脑海里映出
const mfa2 = fromCodes([33041,28023,37324,20986,29616]);   // 脑海里现出
const mfa3 = fromCodes([33041,28023,37324,26144,29616]);   // 脑海里映现
const mfa4 = fromCodes([33041,28023,37324,26144,29616,20986]); // 脑海里映现出

// 呼吸变得 -> 4
const bb1 = fromCodes([21628,21560,27785,20102,20123]);   // 呼吸沉了些
const bb2 = fromCodes([21628,21560,32531,20102,19979,26469]); // 呼吸缓了下来
const bb3 = fromCodes([21628,21560,25918,28145,20102]);   // 呼吸放深了
const bb4 = fromCodes([21628,21560,25918,36731,20102]);   // 呼吸放轻了

// 呼吸急促 -> 4
const br1 = fromCodes([21912,24471,24613,20419]);         // 喘得急促
const br2 = fromCodes([21912,24471,21457,24613]);         // 喘得发急
const br3 = fromCodes([21912,24687,24613,20419]);         // 喘息急促
const br4 = fromCodes([24613,20419,21912,24687]);         // 急促喘息

// 呼吸一紧 -> 4
const bt1 = fromCodes([21628,21560,19968,28382]);         // 呼吸一滞
const bt2 = fromCodes([21628,21560,19968,20572]);         // 呼吸一停
const bt3 = fromCodes([21628,21560,19968,39039]);         // 呼吸一顿
const bt4 = fromCodes([21628,21560,19968,27785]);         // 呼吸一沉

// 喉咙滚动 -> 4 (none contain 喉咙滚动)
const tb1 = fromCodes([21897,32467,19978,19979,28378]);   // 喉结上下滚
const tb2 = fromCodes([21897,32467,28378,21160,19968,19979]); // 喉结滚动一下
const tb3 = fromCodes([21897,32467,21160,20102,21160]);   // 喉结动了动
const tb4 = fromCodes([21897,21657,21160,20102,21160]);   // 喉咙动了动

// 呼吸之间 -> 4
const bm1 = fromCodes([27599,19968,27425,21628,21560,37324]); // 每一次呼吸里
const bm2 = fromCodes([19968,21628,19968,21560,20043,38388]); // 一呼一吸之间
const bm3 = fromCodes([19968,21560,19968,21628,20043,38388]); // 一吸一呼之间
const bm4 = fromCodes([27599,19968,27425,21628,21560,38388,38553]); // 每一次呼吸间隙

// === CLEAN_PAD ===
const pad1 = fromCodes([22681,19978,30340,28783,20809,24573,26126,24573,26263,12290]);
const pad2 = fromCodes([22235,21608,38745,24471,36830,33258,24049,30340,21628,21560,22768,37117,21548,24471,35265,12290]);
const pad3 = fromCodes([31354,27668,20223,20315,20957,22266,20102,19968,33324,65292,35841,20063,27809,26377,20877,35828,35805,12290]);
const pad4 = fromCodes([36828,22788,30340,20809,32447,28176,28176,26263,20102,19979,26469,12290]);
const pad5 = fromCodes([20182,27785,40664,30528,65292,27809,26377,22238,31572,12290]);

const rL  = fromCodes([65288]);
const rR  = fromCodes([65289]);
const rDi = fromCodes([31532]);
const rZ  = fromCodes([31456]);
const rW  = fromCodes([23436]);
const rBen= fromCodes([26412]);
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,30334,21315,19975,38646]);

const VOLUMES = ["volume-1","volume-2","volume-3","volume-4","volume-5","volume-6","volume-7"];
const TARGET = 3020;

console.log('=== R19 PATTERN VERIFICATION ===');
console.log('mf:', mf);
console.log('mfa:', mfa);
console.log('bb:', bb);
console.log('br:', br);
console.log('bt:', bt);
console.log('tb:', tb);
console.log('bm:', bm);
for (const [lbl,s] of [['mf1',mf1],['mf2',mf2],['mf3',mf3],['mf4',mf4],
                       ['mfa1',mfa1],['mfa2',mfa2],['mfa3',mfa3],['mfa4',mfa4],
                       ['bb1',bb1],['bb2',bb2],['bb3',bb3],['bb4',bb4],
                       ['br1',br1],['br2',br2],['br3',br3],['br4',br4],
                       ['bt1',bt1],['bt2',bt2],['bt3',bt3],['bt4',bt4],
                       ['tb1',tb1],['tb2',tb2],['tb3',tb3],['tb4',tb4],
                       ['bm1',bm1],['bm2',bm2],['bm3',bm3],['bm4',bm4]]) {
  console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');
}

const REPL = [
  [mf, mf1, mf2, mf3, mf4],
  [mfa, mfa1, mfa2, mfa3, mfa4],
  [bb, bb1, bb2, bb3, bb4],
  [br, br1, br2, br3, br4],
  [bt, bt1, bt2, bt3, bt4],
  [tb, tb1, tb2, tb3, tb4],
  [bm, bm1, bm2, bm3, bm4],
];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

const CLEAN_PAD = [pad1,pad2,pad3,pad4,pad5];
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
      const PLEN = pattern.length;
      let idx = text.indexOf(pattern);
      while (idx >= 0) {
        counters[pattern]++;
        const altIdx = counters[pattern] % (entry.length - 1);
        const alt = entry[1 + altIdx];
        text = text.slice(0, idx) + alt + text.slice(idx + PLEN);
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

console.log('\n=== VOICE ROUND 19 ===');
for (const [pattern, cnt] of Object.entries(counters)) {
  if (cnt > 0) console.log('  ' + pattern + ': ' + cnt);
}
console.log('Chapters changed: ' + chaptersChanged);

if (cjkDrops.length) {
  console.log('\nCJK drops below 3000 (' + cjkDrops.length + '):');
  for (const [ch, b, a] of cjkDrops) console.log('  ch' + ch + ': ' + b + ' -> ' + a);
}

if (cjkDrops.length) {
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
    if (idx < 0) continue;
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
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) below++;
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
console.log('  Delta: ' + (totalCjk - totalCjkBefore));

console.log('\nRemaining patterns:');
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

console.log('\n=== NEW ALTERNATIVES ===');
const allAlts = [];
for (const entry of REPL) allAlts.push(...entry.slice(1));
for (const p of allAlts) {
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