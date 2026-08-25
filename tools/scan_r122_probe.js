const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'chapters');
const volumeDirs = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const outPath = path.join(__dirname, 'scan_r122_probe_out.txt');
const out = fs.createWriteStream(outPath);
function log(s) { out.write(s + '\n'); }
function flush() { out.end(); }

log('Scanning chapters...');

let allText = '';
let chapterCount = 0;
for (const vd of volumeDirs) {
  const d = path.join(ROOT, vd);
  if (!fs.existsSync(d)) { log('Missing: ' + d); continue; }
  const files = fs.readdirSync(d).filter(f => /^chapter-\d{2,4}-polished\.md$/.test(f)).sort();
  for (const f of files) {
    allText += fs.readFileSync(path.join(d, f), 'utf8') + '\n';
    chapterCount++;
  }
}
log('Chapters scanned: ' + chapterCount + ' | Total chars: ' + allText.length);
log('='.repeat(80));

function cnt(re) { return (allText.match(re) || []).length; }

// SECTION 1
log('\n### SECTION 1: Known specific patterns ###\n');
const knownPatterns = [
  {name: '29备份', re: /29备份/g},
  {name: '0429备份', re: /0429备份/g},
  {name: '备份把声音传', re: /备份把声音传/g},
  {name: '29备份把声音传', re: /29备份把声音传/g},
  {name: '0429备份把声音传', re: /0429备份把声音传/g},
  {name: '声音在', re: /声音在/g},
  {name: '声音从', re: /声音从/g},
  {name: '声音里', re: /声音里/g},
  {name: '声音中', re: /声音中/g},
  {name: '声音是', re: /声音是/g},
  {name: '声音带', re: /声音带/g},
  {name: '声音向', re: /声音向/g},
  {name: '声音。" (voice+period+quote)', re: /声音。"/g},
  {name: '声音"。 (voice+quote+period)', re: /声音"/g},
  {name: '声音。， (voice+period+comma)', re: /声音。\，/g},
  {name: '声音。。 (voice+double period)', re: /声音。。/g},
  {name: '声音？"', re: /声音\？"/g},
  {name: '嗓音从', re: /嗓音从/g},
  {name: '嗓音在 (non-抖)', re: /嗓音在(?![抖])/g},
  {name: '嗓音里', re: /嗓音里/g},
  {name: '嗓音说', re: /嗓音说/g},
  {name: '嗓音在抖', re: /嗓音在抖/g},
  {name: '嗓音带', re: /嗓音带/g},
  {name: '嗓音传', re: /嗓音传/g},
  {name: '嗓音是', re: /嗓音是/g},
  {name: '声音在0415碎片的最深层循环播放', re: /声音在0415碎片的最深层循环播放/g},
  {name: '声音轻得即将散在空气里', re: /声音轻得即将散在空气里/g},
  {name: '声音。"0428碎片会告诉我路。"', re: /声音。"0428碎片会告诉我路。"/g},
  {name: '声音，"0415时间封印解除了', re: /声音，"0415时间封印解除了/g},
];
const results1 = knownPatterns.map(p => ({ name: p.name, count: cnt(p.re) }))
  .sort((a,b) => b.count - a.count);
results1.forEach(r => log('  ' + r.count.toString().padStart(4) + '  ' + r.name));

// SECTION 2: 声音 + 1 char top 20
log('\n### SECTION 2: 声音 + 1 character (top 20) ###\n');
const voice1 = {};
for (const m of allText.matchAll(/声音(.)/g)) {
  const ch = m[1];
  if (/\d/.test(ch)) continue;
  voice1[ch] = (voice1[ch] || 0) + 1;
}
log('  (Total 声音+non-digit-char matches: ' + Object.values(voice1).reduce((a,b)=>a+b,0) + ')');
Object.entries(voice1).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([ch,c]) => {
  const d = ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === ' ' ? '\\s' : ch === '\t' ? '\\t' : ch;
  log('  ' + c.toString().padStart(4) + '  声音' + d);
});

// SECTION 3: 嗓音 + 1 char top 20
log('\n### SECTION 3: 嗓音 + 1 character (top 20) ###\n');
const voice2 = {};
for (const m of allText.matchAll(/嗓音(.)/g)) {
  const ch = m[1];
  if (/\d/.test(ch)) continue;
  voice2[ch] = (voice2[ch] || 0) + 1;
}
log('  (Total 嗓音+non-digit-char matches: ' + Object.values(voice2).reduce((a,b)=>a+b,0) + ')');
Object.entries(voice2).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([ch,c]) => {
  const d = ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === ' ' ? '\\s' : ch;
  log('  ' + c.toString().padStart(4) + '  嗓音' + d);
});

// SECTION 4: 声音 + 2 chars top 30
log('\n### SECTION 4: 声音 + 2 characters (top 30) ###\n');
const voice3 = {};
for (const m of allText.matchAll(/声音(.)(.)/g)) {
  const pair = m[1] + m[2];
  if (/\d/.test(m[1])) continue;
  voice3[pair] = (voice3[pair] || 0) + 1;
}
log('  (Total 声音+2-char non-digit-first matches: ' + Object.values(voice3).reduce((a,b)=>a+b,0) + ')');
Object.entries(voice3).sort((a,b)=>b[1]-a[1]).slice(0,30).forEach(([pair,c]) => {
  log('  ' + c.toString().padStart(4) + '  声音' + pair);
});

// SECTION 5: verb patterns
log('\n### SECTION 5: 声音 + verb/action patterns ###\n');
const morePatterns = [
  '声音传来','声音传出','声音传递','声音传回','声音传进','声音传播',
  '声音响起','声音浮现','声音消散','声音消失','声音散去','声音退去','声音落下',
  '声音飘来','声音飘过','声音飘散','声音回荡','声音回响',
  '声音炸开','声音刺破','声音碾过','声音裹挟','声音裹着','声音裹入','声音裹进',
  '声音灌入','声音灌进','声音灌满','声音涌入','声音涌出','声音涌进',
  '声音压来','声音压过','声音压过来','声音压下来','声音压顶',
  '声音扫过','声音扫来','声音扫过耳膜','声音扫过空气',
  '声音贴着','声音贴着耳膜','声音贴着皮肤',
  '声音撞进','声音撞入','声音撞进耳膜','声音撞进耳朵',
  '声音钻进','声音钻入','声音钻进耳膜','声音钻进耳朵',
  '声音砸下','声音砸来','声音砸过来',
  '声音压来',
];
const results5 = [...new Set(morePatterns)].map(p => ({ name: p, count: cnt(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g')) }))
  .filter(r => r.count > 0).sort((a,b)=>b.count-a.count);
results5.forEach(r => log('  ' + r.count.toString().padStart(4) + '  ' + r.name));

// SECTION 6: fragment patterns
log('\n### SECTION 6: 碎片/时间封印 patterns ###\n');
const fragPatterns = [
  '0415碎片','0428碎片','0415时间封印','0428时间封印',
  '时间封印解除','碎片会告诉我','碎片的最深层','循环播放','最深层循环',
];
fragPatterns.map(p => ({ name: p, count: cnt(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g')) }))
  .filter(r => r.count > 0).sort((a,b)=>b.count-a.count)
  .forEach(r => log('  ' + r.count.toString().padStart(4) + '  ' + r.name));

// SECTION 7: Context samples
log('\n### SECTION 7: Context samples (first 5 of key patterns) ###\n');
function sample(re, label, total, n) {
  log('\n--- ' + label + ' (total: ' + total + ', first ' + n + ') ---');
  let found = 0;
  for (const m of allText.matchAll(re)) {
    if (found >= n) break;
    const start = Math.max(0, m.index - 40);
    const end = Math.min(allText.length, m.index + label.length + 40);
    const ctx = allText.substring(start, end).replace(/\s+/g, ' ').trim();
    log('  ...' + ctx + '...');
    found++;
  }
}
sample(/声音。"/g, '声音。"', cnt(/声音。"/g), 5);
sample(/声音。"0428碎片会告诉我路。"/g, '声音。"0428碎片会告诉我路。"', cnt(/声音。"0428碎片会告诉我路。"/g), 5);
sample(/备份把声音传/g, '备份把声音传', cnt(/备份把声音传/g), 5);
sample(/声音轻得即将散在空气里/g, '声音轻得即将散在空气里', cnt(/声音轻得即将散在空气里/g), 5);
sample(/嗓音在抖/g, '嗓音在抖', cnt(/嗓音在抖/g), 5);
sample(/声音。"0415时间封印解除了/g, '声音。"0415时间封印解除了', cnt(/声音。"0415时间封印解除了/g), 5);

// SECTION 8: All 嗓音 occurrences
log('\n### SECTION 8: All 嗓音 occurrences with context ###\n');
const naoCtx = [];
for (const m of allText.matchAll(/嗓音/g)) {
  const start = Math.max(0, m.index - 20);
  const end = Math.min(allText.length, m.index + 30);
  naoCtx.push(allText.substring(start, end).replace(/\s+/g, ' ').trim());
}
log('  Total 嗓音 occurrences: ' + naoCtx.length);
naoCtx.forEach(ctx => log('  ...' + ctx + '...'));

// SECTION 9: 声音中 / 声音向 / 声音是 context
log('\n### SECTION 9: 声音中 / 声音向 / 声音是 context ###\n');
sample(/声音中/g, '声音中', cnt(/声音中/g), 10);
sample(/声音向/g, '声音向', cnt(/声音向/g), 10);
sample(/声音是/g, '声音是', cnt(/声音是/g), 10);

// SECTION 10: 备份 patterns
log('\n### SECTION 10: 备份 patterns ###\n');
const backupPatterns = [
  '备份把声音','0429备份','29备份','备份传来','备份把','备份说',
  '备份的','备份将','备份在',
];
backupPatterns.map(p => ({ name: p, count: cnt(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g')) }))
  .filter(r => r.count > 0).sort((a,b)=>b.count-a.count)
  .forEach(r => log('  ' + r.count.toString().padStart(4) + '  ' + r.name));

log('\n### DONE ###');
flush();
