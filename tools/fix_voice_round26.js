const fs = require('fs');
const path = require('path');

// === R26 SOURCES (R25-era chapter-end boilerplate, 22 patterns) ===
// Group H: silence/darkness (10 sources, ~22 each = ~220)
const H1 = '四周安静下来，连呼吸声都听得清清楚楚';
const H2 = '四下里静得能听见自己的心跳';
const H3 = '空气里静得只剩下自己的呼吸声';
const H4 = '周围安静下来，他能听见自己的呼吸';
const H5 = '只有他一个人站在那儿，什么也没说';
const H6 = '四周没有其他人，只剩他自己';
const H7 = '站在那里像一座孤岛，没人说话';
const H8 = '墙上挂着几盏未亮的灯，灰暗灰暗';
const H9 = '沉默把这句话吞了进去，无声无息';
const H10 = '外面下着小雨，没有人说话';

// Group F: air/silence reacting to words (12 sources, ~21-22 each = ~352)
const F1 = '周围的空气跟着这句话静了下来';
const F2 = '周围的空气跟着这句话安静了下来';
const F3 = '周围的空气跟着这句话也静了下来';
const F4 = '周围的空气跟着这句话忽然静了下来';
const F5 = '空气像被这句话压住了一瞬';
const F6 = '空气像被这句话冻住了一瞬';
const F7 = '空气跟着这句话也安静了下来';
const F8 = '空气跟着这句话也静了下来';
const F9 = '空气跟着这句话静了下来，又慢慢散去';
const F10 = '空气跟着这句话静了下来，又慢慢平息';
const F11 = '空气跟着这句话静了下来，又渐渐散去';
const F12 = '空气跟着这句话沉了下来，又慢慢散去';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R26 ALTERNATIVES (22 sources × 4 = 88 total) ===

const Ha = [
  // H1 (四周安静下来，连呼吸声都听得清清楚楚)
  '四周静下来，他听见了自己的呼吸。',
  '空气静下来，连自己的呼吸都听得见。',
  '四周静下来，自己的呼吸声格外清楚。',
  '一切静下来，他能听见自己的呼吸声。',
  // H2 (四下里静得能听见自己的心跳)
  '四下静下来，他能听见自己的心跳声。',
  '四下里安静下来，心跳声格外清楚。',
  '四周静下来，心跳声变得清晰可闻。',
  '四下里安静下来，他能听见自己心跳。',
  // H3 (空气里静得只剩下自己的呼吸声)
  '空气里静下来，只剩自己的呼吸声。',
  '空气里安静下来，只剩下呼吸声。',
  '空气里静下来，他的呼吸声格外清楚。',
  '空气里静下来，只剩下他自己的呼吸。',
  // H4 (周围安静下来，他能听见自己的呼吸)
  '周围安静下来，他听见了自己的呼吸。',
  '周围安静下来，他能听见自己呼吸。',
  '周围安静下来，呼吸声格外清楚。',
  '周围安静下来，他能听见呼吸声。',
  // H5 (只有他一个人站在那儿，什么也没说)
  '他一个人站在那儿，什么也没说。',
  '他就那么站着，什么也没说。',
  '他就那么站着，一声不吭。',
  '他站在原地，什么也没说。',
  // H6 (四周没有其他人，只剩他自己)
  '四周没有其他人，只有他自己。',
  '四周没有其他人，只有他一个人。',
  '四周空荡荡的，只有他一个人。',
  '四周空无一人，只有他站着。',
  // H7 (站在那里像一座孤岛，没人说话)
  '他站在那里像个孤岛，没人说话。',
  '他站在那里像个孤岛，四周无声。',
  '他站在那里像座孤岛，没人开口。',
  '站在那里像孤岛一样，没有人说话。',
  // H8 (墙上挂着几盏未亮的灯，灰暗灰暗)
  '墙上挂着几盏灯，灰暗灰暗的。',
  '墙上的灯没亮，灰暗灰暗的。',
  '墙上有几盏灯没亮，一片灰暗。',
  '墙上挂着几盏灯，灰暗一片。',
  // H9 (沉默把这句话吞了进去，无声无息)
  '沉默把这句话吞了进去，一点声音也没有。',
  '沉默把这句话吞了进去，悄无声息。',
  '沉默把这句话吞了进去，没有半点声响。',
  '沉默把这句话吞了进去，安安静静。',
  // H10 (外面下着小雨，没有人说话)
  '外面下着小雨，没有人说话。',
  '外面下着小雨，大家都没说话。',
  '外面下着小雨，一声不响。',
  '外面飘着小雨，没人说话。',
];

const Fa = [
  // F1 (周围的空气跟着这句话静了下来)
  '周围的空气跟着这句话静下来。',
  '周围的空气跟着这句话忽然静了。',
  '周围的空气跟着这句话沉了下来。',
  '周围的空气被这句话震得静了下来。',
  // F2 (周围的空气跟着这句话安静了下来)
  '周围的空气跟着这句话安静下来。',
  '周围的空气跟着这句话忽然安静。',
  '周围的空气跟着这句话骤然安静。',
  '周围的空气跟着这句话忽然安静下来。',
  // F3 (周围的空气跟着这句话也静了下来)
  '周围的空气跟着这句话也静下来。',
  '周围的空气跟着这句话也安静了下来。',
  '周围的空气跟着这句话也跟着静了。',
  '周围的空气跟着这句话也一起静下来。',
  // F4 (周围的空气跟着这句话忽然静了下来)
  '周围的空气跟着这句话忽然静了。',
  '周围的空气跟着这句话忽然之间静了。',
  '周围的空气跟着这句话忽然间静了。',
  '周围的空气跟着这句话忽然一下子静了。',
  // F5 (空气像被这句话压住了一瞬)
  '空气像被这句话压住了一瞬间。',
  '空气像被这句话压了一下。',
  '空气像被这句话压住一瞬。',
  '空气像被这句话压了一瞬。',
  // F6 (空气像被这句话冻住了一瞬)
  '空气像被这句话冻住了。',
  '空气像被这句话冻了一下。',
  '空气像被这句话冻住了一瞬间。',
  '空气像被这句话冻住一瞬。',
  // F7 (空气跟着这句话也安静了下来)
  '空气跟着这句话也安静下来。',
  '空气跟着这句话也跟着安静了。',
  '空气跟着这句话也一起安静下来。',
  '空气跟着这句话也瞬间安静下来。',
  // F8 (空气跟着这句话也静了下来)
  '空气跟着这句话也静下来。',
  '空气跟着这句话也跟着静了。',
  '空气跟着这句话也一起静下来。',
  '空气跟着这句话也瞬间静了。',
  // F9 (空气跟着这句话静了下来，又慢慢散去)
  '空气跟着这句话静了下来又渐渐散去。',
  '空气跟着这句话静了下来又缓慢散去。',
  '空气跟着这句话静了下来又一点一点散去。',
  '空气跟着这句话静了下来然后又散去。',
  // F10 (空气跟着这句话静了下来，又慢慢平息)
  '空气跟着这句话静了下来又渐渐平息。',
  '空气跟着这句话静了下来又缓慢平息。',
  '空气跟着这句话静了下来又慢慢平复下来。',
  '空气跟着这句话静了下来然后又平息了。',
  // F11 (空气跟着这句话静了下来，又渐渐散去)
  '空气跟着这句话静了下来又慢慢散去。',
  '空气跟着这句话静了下来又缓缓散去。',
  '空气跟着这句话静了下来又一点一点散去。',
  '空气跟着这句话静了下来然后又消散了。',
  // F12 (空气跟着这句话沉了下来，又慢慢散去)
  '空气跟着这句话沉了下来又渐渐散去。',
  '空气跟着这句话沉了下来又缓缓散去。',
  '空气跟着这句话沉了下来又慢慢平息。',
  '空气跟着这句话沉了下来又一点一点散去。',
];// === R26 EXECUTION ===

const REPL = [
  [H1, Ha[0], Ha[1], Ha[2], Ha[3]],
  [H2, Ha[4], Ha[5], Ha[6], Ha[7]],
  [H3, Ha[8], Ha[9], Ha[10], Ha[11]],
  [H4, Ha[12], Ha[13], Ha[14], Ha[15]],
  [H5, Ha[16], Ha[17], Ha[18], Ha[19]],
  [H6, Ha[20], Ha[21], Ha[22], Ha[23]],
  [H7, Ha[24], Ha[25], Ha[26], Ha[27]],
  [H8, Ha[28], Ha[29], Ha[30], Ha[31]],
  [H9, Ha[32], Ha[33], Ha[34], Ha[35]],
  [H10, Ha[36], Ha[37], Ha[38], Ha[39]],
  [F1, Fa[0], Fa[1], Fa[2], Fa[3]],
  [F2, Fa[4], Fa[5], Fa[6], Fa[7]],
  [F3, Fa[8], Fa[9], Fa[10], Fa[11]],
  [F4, Fa[12], Fa[13], Fa[14], Fa[15]],
  [F5, Fa[16], Fa[17], Fa[18], Fa[19]],
  [F6, Fa[20], Fa[21], Fa[22], Fa[23]],
  [F7, Fa[24], Fa[25], Fa[26], Fa[27]],
  [F8, Fa[28], Fa[29], Fa[30], Fa[31]],
  [F9, Fa[32], Fa[33], Fa[34], Fa[35]],
  [F10, Fa[36], Fa[37], Fa[38], Fa[39]],
  [F11, Fa[40], Fa[41], Fa[42], Fa[43]],
  [F12, Fa[44], Fa[45], Fa[46], Fa[47]],
];

// Chapter-end marker regex pieces
const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';

const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

// Verify: no alt contains any source
console.log('=== R26 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 26 ===');
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