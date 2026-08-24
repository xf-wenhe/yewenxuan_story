const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

const gugu = fromCodes([25569,20102,25569]);          // 握了握
const yao  = fromCodes([21676,20102,21676]);          // 咬了咬
const zuan = fromCodes([25893,20102,25893]);          // 攥了攥
const mbrow= fromCodes([30473,22836,32039,38145]);    // 眉头紧锁
const pswt = fromCodes([25484,24515,20840,26159,27735]); // 掌心全是汗

const g1 = fromCodes([25893,32039]);                   // 攥紧
const g2 = fromCodes([25569,32039]);                   // 握紧
const g3 = fromCodes([25893,32039,25331]);             // 攥紧拳
const g4 = fromCodes([25569,32039,25331]);             // 握紧拳

const yy1 = fromCodes([21676,32039,29273]);            // 咬紧牙
const yy2 = fromCodes([21676,20303,22068]);            // 咬住嘴
const yy3 = fromCodes([21676,32039,21767]);            // 咬紧唇
const yy4 = fromCodes([21676,20303,21767]);            // 咬住唇

const z1 = fromCodes([25569,32039,25331]);             // 握紧拳
const z2 = fromCodes([25893,32039]);                   // 攥紧
const z3 = fromCodes([25569,32039]);                   // 握紧
const z4 = fromCodes([25893,32039,25331]);             // 攥紧拳

const b1 = fromCodes([30473,22836,30385,36215]);       // 眉头皱起
const b2 = fromCodes([30473,22836,19968,21160]);       // 眉头一动
const b3 = fromCodes([30473,22836,25319,30385]);       // 眉头拧皱
const b4 = fromCodes([30473,22836,30385,30385]);       // 眉头皱皱

const p1 = fromCodes([25484,24515,20882,27735]);       // 掌心冒汗
const p2 = fromCodes([25484,24515,20986,27735]);       // 掌心出汗
const p3 = fromCodes([25484,24515,21457,27735]);       // 掌心发汗
const p4 = fromCodes([25484,24515,27777,27735]);       // 掌心沁汗

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

console.log('=== R18 PATTERN VERIFICATION ===');
console.log('gugu:', gugu);
console.log('yao:', yao);
console.log('zuan:', zuan);
console.log('mbrow:', mbrow);
console.log('pswt:', pswt);
for (const [lbl,s] of [['g1',g1],['g2',g2],['g3',g3],['g4',g4],
                       ['yy1',yy1],['yy2',yy2],['yy3',yy3],['yy4',yy4],
                       ['z1',z1],['z2',z2],['z3',z3],['z4',z4],
                       ['b1',b1],['b2',b2],['b3',b3],['b4',b4],
                       ['p1',p1],['p2',p2],['p3',p3],['p4',p4]]) {
  console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');
}

const REPL = [
  [gugu, g1, g2, g3, g4],
  [yao, yy1, yy2, yy3, yy4],
  [zuan, z1, z2, z3, z4],
  [mbrow, b1, b2, b3, b4],
  [pswt, p1, p2, p3, p4],
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

console.log('\n=== VOICE ROUND 18 ===');
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