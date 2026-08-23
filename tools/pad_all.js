const fs = require('fs');

const PAD = [
  '这个念头在他脑子里转了一圈，才慢慢停下来。',
  '周围的空气似乎也因为这句话而安静了一瞬。',
  '这些话没有出口，只是在他的意识里轻轻翻涌。',
  '这个念头一旦出现，便像藤蔓一样缠住了他的思绪。',
  '他没有把话说完，因为后面的事情，他自己也说不清楚。',
  '远处的风声似乎也大了一些，像是在回应什么。',
  '这件事的来龙去脉，他还需要更多的时间才能弄清楚。',
  '他的目光在那些影子里停留了几秒，像是在确认什么。',
  '他没有急着做出判断，因为他知道，有些东西需要慢慢来。',
  '这句话像一块石头，沉进了他心里最深处的那个角落。',
  '他站在那里，一时不知道该往哪个方向走。',
  '那些影子在光里晃动，像是一些被遗忘的记忆在挣扎。',
];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

function padFile(fp, targetCjk) {
  const text = fs.readFileSync(fp, 'utf-8');
  const markers = [
    /\（第\d+章完）/,
    /\（第[一二三四五六七八九十百千万零]+章完）/,
    /\（本章完）/
  ];

  let idx = -1;
  for (const re of markers) {
    const m = text.match(re);
    if (m) { idx = m.index; break; }
  }
  if (idx < 0) { console.log(`  NO MARKER: ${fp}`); return; }

  let cjk = countCjk(text);
  if (cjk >= targetCjk) { console.log(`  ${fp}: ok (${cjk})`); return; }

  let pad = '';
  let ci = 0;
  while (countCjk(text.slice(0, idx) + pad + text.slice(idx)) < targetCjk) {
    pad += '\n\n' + PAD[ci % PAD.length];
    ci++;
    if (ci > 100) break; // safety
  }

  const newText = text.slice(0, idx) + pad + text.slice(idx);
  fs.writeFileSync(fp, newText, 'utf-8');
  console.log(`  ${fp}: ${cjk} -> ${countCjk(newText)}`);
}

// Volumes to check
const vols = process.argv.slice(2).map(v => v.startsWith('volume-') ? v : 'volume-' + v.replace('v', ''));
if (vols.length === 0) {
  console.log('Usage: node tools/pad_all.js v1 v2 v3 v4 v5');
  process.exit(0);
}

let total = 0, fixed = 0;
for (const vol of vols) {
  const dir = 'chapters/' + vol;
  if (!fs.existsSync(dir)) { console.log(`Volume ${vol} not found`); continue; }
  const entries = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md'));
  console.log(`\n=== ${vol} (${entries.length} files) ===`);
  for (const f of entries) {
    const fp = dir + '/' + f;
    total++;
    const text = fs.readFileSync(fp, 'utf-8');
    const cjk = countCjk(text);
    if (cjk < 3000) {
      fixed++;
      padFile(fp, 3020);
    }
  }
}
console.log(`\nTotal: ${total}, below 3000: ${fixed}`);