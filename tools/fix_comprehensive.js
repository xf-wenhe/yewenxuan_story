// fix_comprehensive.js — Round 215: 全库修复
// 修复：卷末标记、BOM、弯引号、繁体字、说道、标题格式
const fs = require('fs'), p = require('path');

function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

// ========== 1. 卷末标记 ==========
console.log('=== 1. 卷末标记修复 ===');
const volMarkers = [
  { ch: 100,  marker: '——第一卷·入局·完——' },
  { ch: 250,  marker: '——第二卷·边境·完——' },
  { ch: 400,  marker: '——第三卷·裂谷·完——' },
  { ch: 550,  marker: '——第四卷·深渊·完——' },
  { ch: 750,  marker: '——第五卷·觉醒·完——' },
  { ch: 918,  marker: '——第六卷·回廊·完——' },
  { ch: 1000, marker: '——第七卷·闭环·完——' },
];

for (const vm of volMarkers) {
  const fp = getFP(vm.ch);
  if (!fs.existsSync(fp)) { console.log('  ch' + vm.ch + ': file missing'); continue; }
  let text = fs.readFileSync(fp, 'utf-8');

  if (text.includes(vm.marker)) {
    console.log('  ch' + vm.ch + ': already OK');
    continue;
  }

  // Replace old-style paren markers
  const oldMarkerRe = /（第[一二三四五六七八九十]+卷[^）]*）/;
  if (oldMarkerRe.test(text)) {
    text = text.replace(oldMarkerRe, vm.marker);
    fs.writeFileSync(fp, text, 'utf-8');
    console.log('  ch' + vm.ch + ': replaced → ' + vm.marker);
  } else {
    text = text.trimEnd() + '\n\n' + vm.marker + '\n';
    fs.writeFileSync(fp, text, 'utf-8');
    console.log('  ch' + vm.ch + ': added → ' + vm.marker);
  }
}

// ========== 2. BOM 去除 ==========
console.log('\n=== 2. BOM 去除 ===');
let bomFixed = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;
  const buf = fs.readFileSync(fp);
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    fs.writeFileSync(fp, buf.slice(3));
    bomFixed++;
  }
}
console.log('  BOM removed: ' + bomFixed);

// ========== 3. 弯引号 → 直引号 ==========
console.log('\n=== 3. 弯引号 → 直引号 ===');
let quoteFixed = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;
  let text = fs.readFileSync(fp, 'utf-8');
  if (text.includes('“') || text.includes('”')) {
    text = text.replace(/[“”]/g, '"');
    fs.writeFileSync(fp, text, 'utf-8');
    quoteFixed++;
  }
}
console.log('  Curly→straight: ' + quoteFixed + ' chapters');

// ========== 4. 繁体字 → 简体 (ch488) ==========
console.log('\n=== 4. 繁体字 → 简体 ===');
const charMap = {
  '葉':'叶','軒':'轩','趙':'赵','裡':'里','動':'动','輕':'轻',
  '從':'从','覺':'觉','閉':'闭','環':'环','說':'说','嚨':'咙',
  '臉':'脸','開':'开','張':'张','體':'体','發':'发','軟':'软',
  '詞':'词','顆':'颗','虛':'虚','難':'难',
};

let ch488Fixed = false;
{
  const fp = getFP(488);
  if (fs.existsSync(fp)) {
    let text = fs.readFileSync(fp, 'utf-8');
    let newText = '';
    for (const c of text) {
      newText += charMap[c] || c;
    }
    if (newText !== text) {
      fs.writeFileSync(fp, newText, 'utf-8');
      ch488Fixed = true;
      // Count remaining traditional
      let remaining = 0;
      for (const t of Object.keys(charMap)) {
        remaining += (newText.match(new RegExp(t, 'g')) || []).length;
      }
      console.log('  ch488: fixed, remaining traditional: ' + remaining);
    }
  }
}
if (!ch488Fixed) console.log('  ch488: no traditional found or file missing');

// ========== 5. "说道" → "说" ==========
console.log('\n=== 5. "说道" → "说" ===');
let shuoDaoTotal = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;
  let text = fs.readFileSync(fp, 'utf-8');
  if (!text.includes('说道')) continue;

  shuoDaoTotal += (text.match(/说道/g) || []).length;

  // Most specific first
  text = text.replace(/开口说道/g, '开口');
  text = text.replace(/(轻声|快速|立刻|低声|突然|冷冷|静静)说道/g, '$1说');
  text = text.replace(/说道/g, '说');

  fs.writeFileSync(fp, text, 'utf-8');
}
console.log('  说道→说: ' + shuoDaoTotal);

// ========== 6. 标题格式统一 (V4-V7: 阿拉伯→汉字) ==========
console.log('\n=== 6. 标题格式统一 ===');

function toChineseNum(n) {
  if (n === 0) return '零';
  const d = ['零','一','二','三','四','五','六','七','八','九'];

  if (n < 10) return d[n];
  if (n < 20) return '十' + (n % 10 ? d[n % 10] : '');
  if (n < 100) {
    const t = Math.floor(n / 10), o = n % 10;
    return d[t] + '十' + (o ? d[o] : '');
  }
  if (n < 1000) {
    const h = Math.floor(n / 100), rest = n % 100;
    let r = d[h] + '百';
    if (rest === 0) return r;
    if (rest < 10) return r + '零' + d[rest];
    if (rest < 20) return r + '一十' + (rest % 10 ? d[rest % 10] : '');
    const t = Math.floor(rest / 10), o = rest % 10;
    return r + d[t] + '十' + (o ? d[o] : '');
  }
  if (n < 10000) {
    const th = Math.floor(n / 1000), rest = n % 1000;
    let r = d[th] + '千';
    if (rest === 0) return r;
    if (rest < 100) return r + '零' + toChineseNum(rest);
    return r + toChineseNum(rest);
  }
  return String(n);
}

let titleFixed = 0;
for (let ch = 401; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;
  let text = fs.readFileSync(fp, 'utf-8');
  const cn = toChineseNum(ch);
  const orig = text;

  // Title: # 第401章 → # 第四百零一章
  text = text.replace(new RegExp('# 第' + ch + '章'), '# 第' + cn + '章');
  // End marker: （第401章完） → （第四百零一章完）
  text = text.replace(new RegExp('（第' + ch + '章完）'), '（第' + cn + '章完）');

  if (text !== orig) {
    fs.writeFileSync(fp, text, 'utf-8');
    titleFixed++;
  }
}
console.log('  Title converted: ' + titleFixed + ' chapters (V4-V7)');

// ========== 7. 最终验证 ==========
console.log('\n=== 最终验证 ===');

// BOM
let bomLeft = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const buf = fs.readFileSync(getFP(ch));
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) bomLeft++;
}
console.log('  BOM: ' + bomLeft);

// Curly quotes
let curlyLeft = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  if (text.includes('“') || text.includes('”')) curlyLeft++;
}
console.log('  弯引号: ' + curlyLeft);

// Traditional
let tradLeft = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  for (const t of ['葉','軒','趙','裡','動','輕','從','覺','閉','環','說','嚨','臉','開','張','體','發','軟','詞','顆','虛','難']) {
    if (text.includes(t)) { tradLeft++; break; }
  }
}
console.log('  繁体: ' + tradLeft);

// 说道
let shuoDaoLeft = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  shuoDaoLeft += (text.match(/说道/g) || []).length;
}
console.log('  说道: ' + shuoDaoLeft);

// Volume markers
console.log('\n  卷末标记:');
for (const vm of volMarkers) {
  const text = fs.readFileSync(getFP(vm.ch), 'utf-8');
  console.log('  ch' + vm.ch + ': ' + (text.includes(vm.marker) ? '✓' : '✗'));
}

// Title format sample
console.log('\n  标题抽样:');
for (const ch of [401, 500, 750, 1000]) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const t = text.split('\n').find(l => l.startsWith('#'));
  console.log('  ch' + ch + ': ' + t);
}

// CJK total
let totalCjk = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  for (const c of text) { if (c >= '一' && c <= '鿿') totalCjk++; }
}
console.log('\n  总CJK: ' + totalCjk.toLocaleString());

console.log('\n=== 修复完成 ===');
