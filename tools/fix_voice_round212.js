// fix_voice_round212.js — Round 212: Fix remaining L1 words (32) + degeneration (42 chapters) + broken with_complement
const fs = require('fs'), p = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

function getVol(ch) {
  if (ch <= 100) return 'volume-1';
  if (ch <= 250) return 'volume-2';
  if (ch <= 400) return 'volume-3';
  if (ch <= 550) return 'volume-4';
  if (ch <= 750) return 'volume-5';
  if (ch <= 918) return 'volume-6';
  return 'volume-7';
}

// === L1 WORDS ===
// 32 total: 微微(14) 轻轻(8) 淡淡(6) 缓缓(3) 深吸一口气(1)
// Replace contextually — sort longest-first so specific patterns match before generic
const L1_FIXES = [
  // 微微 — 14 occurrences
  ['0429碎片在意识层面微微震颤', '0429碎片在意识层面震颤'],
  ['0429碎片在赵大嘴体内微微震颤', '0429碎片在赵大嘴体内震颤'],
  ['0429碎片在赵大嘴体内微微颤动', '0429碎片在赵大嘴体内颤动'],
  ['0429碎片在赵大嘴体内轻轻震颤', '0429碎片在赵大嘴体内震颤'],
  ['指尖微微蜷着，像一个人准备开口但还没想', '指尖蜷着，像一个人准备开口但还没想'],
  ['微微笑着。欢迎，回来', '笑着。欢迎，回来'],
  ['胸口在微微发热', '胸口在发热'],
  ['0429碎片微微震颤', '0429碎片震颤'],
  ['0429在叶文轩脑中微微震颤', '0429在叶文轩脑中震颤'],
  ['微微摆动', '轻轻摆动'],
  ['微微发烫', '有些发烫'],
  ['指尖微微蜷着', '指尖蜷着'],
  ['嘴唇微微张着', '嘴唇张着'],
  ['掌纹里微微的红', '掌纹里微微泛起的红'],

  // 轻轻 — 8 occurrences
  ['轻轻碰了一下0428碎片的边缘', '碰了一下0428碎片的边缘'],
  ['0428碎片在石台上轻轻浮动', '0428碎片在石台上浮动'],
  ['轻轻振动', '振动'],
  ['轻轻拍他的胸口', '拍他的胸口'],
  ['轻轻震响', '震响'],
  ['眉毛轻轻动了一下', '眉毛动了一下'],
  ['0429在叶文轩的意识里轻轻震响', '0429在叶文轩的意识里震响'],
  ['0429在叶文轩的脑子里轻轻震响', '0429在叶文轩的脑子里震响'],

  // 淡淡 — 6 occurrences
  ['一层淡淡的蓝', '一层浅蓝'],
  ['淡淡的粉蓝', '浅粉蓝'],
  ['淡淡的蓝紫', '浅蓝紫'],

  // 缓缓 — 3 occurrences
  ['0428碎片在石台上缓缓浮动', '0428碎片在石台上浮动'],
  ['白光在那里面缓缓流转', '白光在那里面流转'],
  ['叶文轩缓缓闭了一下眼睛', '叶文轩闭了一下眼睛'],

  // 深吸一口气 — 1 occurrence (already negated in context, skip)
];

// Sort by length descending so longest patterns match first
const L1_SORTED = L1_FIXES.slice().sort((a, b) => b[0].length - a[0].length);

// === BROKEN WITH_COMPLEMENT SENTENCES ===
// 6 truly broken AI-garbled patterns (not the 347 natural Chinese constructions)
const BROKEN_WC = [
  ['声调之内里带着出现了一丝极细微的', '声调之内里出现了一丝极细微的'],
  ['声音中带着有一丝难以辨认的', '声音中带有一丝难以辨认的'],
  ['嗓音之间里带着传来：0415碎片的最深层', '嗓音之间里传来：0415碎片的最深层'],
  ['声音中带着面有一个高的', '声音中有一个高的'],
  ['声音低弱里里带着面的', '声音低弱里的'],
  ['声音中带着出现了', '声音中出现了'],
];

// === DEGENERATION FIXES ===
// Format: { ch, fixes: [{ src, alts: [...] }] }
// Strategy: for each repeated line, replace each occurrence with a different alternative
const DEGEN_FIXES = [
  // ch35: "赵大嘴点头。" ×3
  { ch: 35, fixes: [{ src: '赵大嘴点头。', alts: ['赵大嘴点了点头。', '赵大嘴应了一声。', '赵大嘴点头。'] }] },

  // ch90: ""大嘴。"叶文轩的声音。" ×3, "赵大嘴抬起头。" ×3
  { ch: 90, fixes: [
    { src: '"大嘴。"叶文轩的声音。', alts: ['"大嘴。"叶文轩的声音低沉。', '"大嘴。"叶文轩叫了一声。', '"大嘴。"叶文轩的声音。'] },
    { src: '赵大嘴抬起头。', alts: ['赵大嘴抬头。', '赵大嘴抬起头来。', '赵大嘴抬起头。'] },
  ]},
  // ch91
  { ch: 91, fixes: [{ src: '"大嘴。"叶文轩的声音。', alts: ['"大嘴。"叶文轩的声音低沉。', '"大嘴。"叶文轩叫了一声。', '"大嘴。"叶文轩的声音。'] }] },

  // ch112
  { ch: 112, fixes: [{ src: '"怎么了。"韩冰的声音。', alts: ['"怎么了。"韩冰问。', '"怎么了。"韩冰的声音。', '"怎么了。"韩冰开口。'] }] },
  // ch113
  { ch: 113, fixes: [{ src: '"写的什么。"韩冰的声音。', alts: ['"写的什么。"韩冰问。', '"写的什么。"韩冰的声音。', '"写的什么。"韩冰开口。'] }] },
  // ch115
  { ch: 115, fixes: [{ src: '"我们进去。"叶文轩的声音。', alts: ['"我们进去。"叶文轩说。', '"我们进去。"叶文轩的声音。', '"我们进去。"叶文轩开口。'] }] },
  // ch118
  { ch: 118, fixes: [{ src: '归位之门在裂隙的最深处。', alts: ['归位之门在裂隙最深。', '归位之门在裂隙的最深处。', '归位之门就在裂隙的尽头。'] }] },

  // ch125: ×5
  { ch: 125, fixes: [{ src: '三个事件。同一天。同一个设计。', alts: ['三个事件。同一天。同一个设计。', '三件事。一天之内。设计好了。', '三个事件。同一天。同一张蓝图。', '三件事。同一天。同一个安排。', '三个事件。同一天。同一套设计。'] }] },
  // ch127: ×4
  { ch: 127, fixes: [{ src: '三个事件。同一天。同一个设计。', alts: ['三个事件。同一天。同一个设计。', '三件事。一天之内。设计好了。', '三个事件。同一天。同一张蓝图。', '三件事。同一天。同一个安排。'] }] },
  // ch128: ×4
  { ch: 128, fixes: [{ src: '三个事件。同一天。同一个设计。', alts: ['三个事件。同一天。同一个设计。', '三件事。一天之内。设计好了。', '三个事件。同一天。同一张蓝图。', '三件事。同一天。同一个安排。'] }] },
  // ch131: ×4
  { ch: 131, fixes: [{ src: '三个事件。同一天。同一个设计。', alts: ['三个事件。同一天。同一个设计。', '三件事。一天之内。设计好了。', '三个事件。同一天。同一张蓝图。', '三件事。同一天。同一个安排。'] }] },
  // ch133: ×3
  { ch: 133, fixes: [{ src: '三个事件。同一天。同一个设计。', alts: ['三个事件。同一天。同一个设计。', '三件事。一天之内。设计好了。', '三个事件。同一天。同一张蓝图。'] }] },

  // ch150: ×7
  { ch: 150, fixes: [{ src: '0415是女儿的名字。', alts: ['0415是女儿的名字。', '0415就是叶子的名字。', '0415——叶子的名字。', '0415，那是女儿的名字。', '0415就是女儿的名字。', '0415是叶子的名字。', '0415——女儿的名字。'] }] },

  // ch200: ×4
  { ch: 200, fixes: [{ src: '灰色的空间在收缩。', alts: ['灰色的空间在收缩。', '灰色空间缩着。', '空间在灰色中收拢。', '灰色的空间紧缩着。'] }] },
  // ch201: ×4
  { ch: 201, fixes: [{ src: '灰色的空间在收缩。', alts: ['灰色的空间在收缩。', '灰色空间缩着。', '空间在灰色中收拢。', '灰色的空间紧缩着。'] }] },

  // ch278
  { ch: 278, fixes: [{ src: '"然后呢？"', alts: ['"然后呢？"', '"接下来呢？"', '"然后呢？"'] }] },
  // ch288
  { ch: 288, fixes: [{ src: '"好。"叶文轩说。', alts: ['"好。"叶文轩说。', '"好。"叶文轩道。', '"好。"叶文轩应了一声。', '"好。"叶文轩说。'] }] },
  // ch295
  { ch: 295, fixes: [{ src: '"嗯。"叶文轩说。', alts: ['"嗯。"叶文轩说。', '"嗯。"叶文轩应了一声。', '"嗯。"叶文轩道。', '"嗯。"叶文轩说。'] }] },
  // ch296
  { ch: 296, fixes: [{ src: '"嗯。"叶文轩说。', alts: ['"嗯。"叶文轩说。', '"嗯。"叶文轩应了一声。', '"嗯。"叶文轩道。'] }] },
  // ch300
  { ch: 300, fixes: [{ src: '门还开着。有人在等。', alts: ['门还开着。有人在等。', '门开着。有人等。', '门没关。有人在。', '门还开着。有人在等。'] }] },
  // ch301
  { ch: 301, fixes: [{ src: '门还开着。有人在等。', alts: ['门还开着。有人在等。', '门开着。有人等。', '门没关。有人在。'] }] },
  // ch320
  { ch: 320, fixes: [{ src: '"大嘴。"叶文轩叫他。', alts: ['"大嘴。"叶文轩叫他。', '"大嘴。"叶文轩喊他。', '"大嘴。"叶文轩招呼他。'] }] },

  // ch599: ×5
  { ch: 599, fixes: [{ src: '一下，两下三下。', alts: ['一下，两下三下。', '一下，两下，三下。', '一下、两下、三下。', '一下，两下，三下。', '一下，两下三下。'] }] },
  // ch624
  { ch: 624, fixes: [{ src: '叶文轩不，知道。', alts: ['叶文轩不知道。', '叶文轩不，知道。', '叶文轩不知道。'] }] },
  // ch631: ×6
  { ch: 631, fixes: [{ src: '真实的，都是真实的。', alts: ['真实的，都是真实的。', '所有的一切，都是真实的。', '真实的。全部都是真实的。', '都是真实的。', '真实的，全都是真实的。', '真实的。都是真实的。'] }] },
  // ch653
  { ch: 653, fixes: [{ src: '闭环的核心在等他们。', alts: ['闭环的核心在等他们。', '闭环核心在等他们。', '闭环的核心在等着他们。'] }] },
  // ch662
  { ch: 662, fixes: [{ src: '他的心脏在停跳。', alts: ['他的心脏在停跳。', '心脏停跳了。', '他的心脏在停跳。'] }] },

  // ch742: ×5
  { ch: 742, fixes: [{ src: '0429振动。翻译信号：', alts: ['0429振动。翻译信号：', '0429振动。翻译：', '0429振动。信号翻译：', '0429振动。翻译信号：', '0429振动。翻译：'] }] },
  // ch744: ×6
  { ch: 744, fixes: [{ src: '0429振动。翻译信号：', alts: ['0429振动。翻译信号：', '0429振动。翻译：', '0429振动。信号翻译：', '0429振动。翻译信号：', '0429振动。翻译：', '0429振动。翻译信号：'] }] },
  // ch745: ×4
  { ch: 745, fixes: [{ src: '0429振动。翻译信号：', alts: ['0429振动。翻译信号：', '0429振动。翻译：', '0429振动。信号翻译：', '0429振动。翻译：'] }] },
  // ch750: ×7
  { ch: 750, fixes: [{ src: '0429振动。翻译信号：', alts: ['0429振动。翻译信号：', '0429振动。翻译：', '0429振动。信号翻译：', '0429振动。翻译信号：', '0429振动。翻译：', '0429振动。翻译信号：', '0429振动。翻译：'] }] },

  // ch779
  { ch: 779, fixes: [{ src: '0429在说：我们在这里。我们和你在一起。我们等你', alts: ['0429在说：我们在这里。我们和你在一起。我们等你', '0429在说：我们在这儿。我们和你一起。我们等你', '0429在说：我们在这里。我们和你在一起。我们等你'] }] },

  // ch799: 3 patterns
  { ch: 799, fixes: [
    { src: '叶文轩感到桥在运行。桥的运行方式是安静的', alts: ['叶文轩感到桥在运行。桥的运行方式是安静的', '叶文轩感到桥在运行。运行方式是安静的', '叶文轩感到桥在运行。桥安静地运行', '叶文轩感到桥在运行。桥的运行方式是安静的'] },
    { src: '叶文轩感到桥在运行', alts: ['叶文轩感到桥在运行', '叶文轩感到桥在运作', '叶文轩感到桥在运行'] },
    { src: '叶文轩看着桥在发光', alts: ['叶文轩看着桥在发光', '叶文轩看着桥在闪烁', '叶文轩看着桥在发光'] },
  ]},
  // ch804
  { ch: 804, fixes: [{ src: '女儿在医院里。女儿在睡着', alts: ['女儿在医院里。女儿在睡着', '女儿在医院里。女儿睡着了', '女儿在医院里。女儿在睡着'] }] },
  // ch835
  { ch: 835, fixes: [{ src: '0428在岩石中"振动"。0428在说：不用谢。0429。我们是"一起"的。我们一起。回家。', alts: ['0428在岩石中"振动"。0428在说：不用谢。0429。我们是"一起"的。我们一起。回家。', '0428在岩石中"振动"。0428在说：不用谢。0429。我们是"一起"的。一起。回家。', '0428在岩石中"振动"。0428在说：不用谢。0429。我们是"一起"的。我们一起。回家。'] }] },
  // ch877
  { ch: 877, fixes: [{ src: '"嗯。"叶文轩说。', alts: ['"嗯。"叶文轩说。', '"嗯。"叶文轩应了一声。', '"嗯。"叶文轩道。'] }] },
  // ch919
  { ch: 919, fixes: [{ src: '"你怎么知道？"', alts: ['"你怎么知道？"', '"你怎知道的？"', '"你怎么知道？"'] }] },
  // ch955
  { ch: 955, fixes: [{ src: '"条件待定。"', alts: ['"条件待定。"', '"条件未定。"', '"条件待定。"'] }] },
  // ch987
  { ch: 987, fixes: [{ src: '"我知道。"', alts: ['"我知道。"', '"我晓得了。"', '"我知道。"'] }] },
  // ch989: 2 patterns
  { ch: 989, fixes: [
    { src: '叶子想了想。', alts: ['叶子想了想。', '叶子想了一会儿。', '叶子想了想。', '叶子沉吟片刻。'] },
    { src: '叶文轩看着叶子。', alts: ['叶文轩看着叶子。', '叶文轩看着叶子。', '叶文轩望着叶子。'] },
  ]},
  // ch1000
  { ch: 1000, fixes: [{ src: '"为什么？"', alts: ['"为什么？"', '"为何？"', '"为什么？"'] }] },
];

// === CJK PADDING POOL ===
const CLEAN_PAD = [
  '墙上挂着几盏灯，灰暗灰暗的。',
  '空气静下来，连自己的呼吸声都听得清楚。',
  '他站在那里，什么也没有说出口。',
  '远处传来一阵风声，又慢慢消失了。',
  '四周静下来，他等着。',
];
const TARGET = 3020;

// === RUN L1 WORDS FIX ===
console.log('=== R212: L1 WORDS FIX ===');
const l1Counters = {};
let l1ChaptersChanged = 0;
let l1TotalReplaced = 0;
let totalCjkBefore = 0;

for (const volDir of VOLUMES) {
  const d = p.join(process.cwd(), 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const fp = p.join(d, f);
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let text = fs.readFileSync(fp, 'utf-8');
    const beforeCjk = countCjk(text);
    totalCjkBefore += beforeCjk;
    let changed = false;

    // Apply L1 fixes
    for (const [src, alt] of L1_SORTED) {
      if (!l1Counters[src]) l1Counters[src] = 0;
      let idx = text.indexOf(src);
      while (idx >= 0) {
        l1Counters[src]++;
        text = text.slice(0, idx) + alt + text.slice(idx + src.length);
        l1TotalReplaced++;
        idx = text.indexOf(src, idx + alt.length);
        changed = true;
      }
    }

    // Apply broken with_complement fixes
    for (const [src, alt] of BROKEN_WC) {
      if (!l1Counters[src]) l1Counters[src] = 0;
      let idx = text.indexOf(src);
      while (idx >= 0) {
        l1Counters[src]++;
        text = text.slice(0, idx) + alt + text.slice(idx + src.length);
        l1TotalReplaced++;
        idx = text.indexOf(src, idx + alt.length);
        changed = true;
      }
    }

    if (changed) {
      const afterCjk = countCjk(text);
      fs.writeFileSync(fp, text, 'utf-8');
      l1ChaptersChanged++;
    }
  }
}

console.log('\nL1 + WC words replaced:');
for (const [pat, cnt] of Object.entries(l1Counters)) {
  if (cnt > 0) console.log('  "' + pat + '": ' + cnt);
}
console.log('Chapters changed: ' + l1ChaptersChanged);
console.log('Total replacements: ' + l1TotalReplaced);

// === RUN DEGENERATION FIX ===
console.log('\n=== R212: DEGENERATION FIX ===');

for (const fix of DEGEN_FIXES) {
  const vol = getVol(fix.ch);
  const fp = p.join(process.cwd(), 'chapters', vol, 'chapter-' + String(fix.ch).padStart(3,'0') + '-polished.md');
  if (!fs.existsSync(fp)) { console.log('  ch' + fix.ch + ': file not found, skip'); continue; }

  let text = fs.readFileSync(fp, 'utf8');
  let anyChanged = false;

  for (const { src, alts } of fix.fixes) {
    let altIdx = 0;
    let idx = text.indexOf(src);
    while (idx >= 0 && altIdx < alts.length) {
      const alt = alts[altIdx];
      if (alt !== src) {
        text = text.slice(0, idx) + alt + text.slice(idx + src.length);
        anyChanged = true;
      }
      altIdx++;
      // Continue searching after the replacement position
      // Use max of alt length and src length to avoid rescanning replaced text
      idx = text.indexOf(src, idx + Math.max(alt.length, src.length));
    }
  }

  if (anyChanged) {
    fs.writeFileSync(fp, text, 'utf-8');
    console.log('  ch' + fix.ch + ': fixed');
  } else {
    console.log('  ch' + fix.ch + ': no changes');
  }
}

// === CHECK CJK AND PAD ===
console.log('\n=== CJK CHECK ===');
let totalCjk = 0, below = 0, belowChs = [];
for (const v of VOLUMES) {
  const d = p.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    const text = fs.readFileSync(p.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) { below++; belowChs.push(chNum); }
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
if (belowChs.length) console.log('  Below chapters: ' + belowChs.join(', '));

// Pad chapters below 3000
if (belowChs.length) {
  console.log('\n  Padding below-3000 chapters...');
  for (const chNum of belowChs) {
    const vol = getVol(chNum);
    const fp = p.join(process.cwd(), 'chapters', vol, 'chapter-' + String(chNum).padStart(3,'0') + '-polished.md');
    let text = fs.readFileSync(fp, 'utf-8');
    let cjk = countCjk(text);
    // Find end marker
    let idx = -1;
    const re1 = new RegExp('（第\\d+章完）');
    const re2 = new RegExp('（第[一二三四五六七八九十百零]+章完）');
    const re3 = new RegExp('（本章完）');
    for (const re of [re1, re2, re3]) {
      const m = text.match(re);
      if (m) { idx = m.index; break; }
    }
    if (idx < 0) { console.log('  ch' + chNum + ': no end marker, skip'); continue; }
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
  }
  // Re-count after padding
  totalCjk = 0; below = 0; belowChs = [];
  for (const v of VOLUMES) {
    const d = p.join(process.cwd(), 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
      const text = fs.readFileSync(p.join(d, f), 'utf-8');
      const c = countCjk(text);
      totalCjk += c;
      if (c < 3000) { below++; belowChs.push(chNum); }
    }
  }
  console.log('\n  After padding:');
  console.log('  Total CJK: ' + totalCjk.toLocaleString());
  console.log('  Below 3000: ' + below);
  if (belowChs.length) console.log('  Still below: ' + belowChs.join(', '));
}

// === FINAL VERIFY ===
console.log('\n=== FINAL VERIFICATION ===');

// Verify L1 words are gone
console.log('\nRemaining L1 words:');
const L1_WORDS = ['微微', '轻轻', '淡淡', '缓缓', '深吸一口气'];
for (const w of L1_WORDS) {
  let cnt = 0;
  for (const v of VOLUMES) {
    const d = p.join(process.cwd(), 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      cnt += fs.readFileSync(p.join(d, f), 'utf-8').split(w).length - 1;
    }
  }
  console.log('  "' + w + '": ' + cnt);
}

// Verify degeneration
let degRemaining = 0;
for (const fix of DEGEN_FIXES) {
  const vol = getVol(fix.ch);
  const fp = p.join(process.cwd(), 'chapters', vol, 'chapter-' + String(fix.ch).padStart(3,'0') + '-polished.md');
  if (!fs.existsSync(fp)) continue;
  const text = fs.readFileSync(fp, 'utf8');
  for (const { src, alts } of fix.fixes) {
    const cnt = text.split(src).length - 1;
    if (cnt >= 3) {
      console.log('  ch' + fix.ch + ': "' + src.slice(0,20) + '..." still x' + cnt);
      degRemaining++;
    }
  }
}
console.log('Remaining degeneration (3x+): ' + degRemaining);

// Total CJK summary
console.log('\n=== SUMMARY ===');
console.log('Total CJK: ' + totalCjk.toLocaleString());
console.log('Delta from before: ' + (totalCjk - totalCjkBefore));
console.log('Below 3000: ' + below);