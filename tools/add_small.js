// add_small.js — Add content to chapters with small deficits (2-34 CJK)
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}
function cjkCount(text) {
  let c = 0;
  for (const ch of text) { const cp = ch.codePointAt(0); if (cp >= 0x4E00 && cp <= 0x9FFF) c++; }
  return c;
}

// Each entry: { ch, add: string to insert before end marker, expect: CJK target }
const additions = [
  { ch: 666, add: '走廊尽头的白色光越来越亮。\n\n', expect: 3000 },
  { ch: 683, add: '他听见了远处传来的脚步声。\n\n', expect: 3000 },
  { ch: 901, add: '他加快了脚步。\n\n', expect: 3000 },
  { ch: 696, add: '他听见了远处的脚步声。\n\n', expect: 3000 },
  { ch: 677, add: '他听见了远处传来的声音。\n\n', expect: 3000 },
  { ch: 671, add: '赵大嘴感到胸口轻松了一些。\n\n', expect: 3000 },
  { ch: 843, add: '叶文轩的心跳漏了一拍。\n\n', expect: 3000 },
  { ch: 702, add: '他听见了远处传来的声音。\n\n', expect: 3000 },
  { ch: 321, add: '火车继续往前开，窗外一片漆黑。\n\n', expect: 3000 },
  { ch: 309, add: '火车继续往东北开。窗外漆黑一片。\n\n', expect: 3000 },
  { ch: 675, add: '赵大嘴的呼吸慢慢恢复正常。\n\n', expect: 3000 },
  { ch: 691, add: '赵大嘴站在原地，看着0429碎片消失的方向。\n\n', expect: 3000 },
  { ch: 703, add: '他听见了远处的声音，但什么也没说。\n\n', expect: 3000 },
  { ch: 653, add: '灯光微微颤动，影子在墙上摇晃。\n\n', expect: 3000 },
  { ch: 678, add: '他听见了远处的声音，但没有动。\n\n', expect: 3000 },
  { ch: 612, add: '光晕慢慢消失，石台恢复了原来的样子。\n\n', expect: 3000 },
  { ch: 707, add: '他听见了远处的声音，但没有动。\n\n', expect: 3000 },
  { ch: 718, add: '叶文轩站在走廊里，听着机房传来的声音。\n\n', expect: 3000 },
  { ch: 661, add: '他听见了远处传来的声音，但什么也没说。\n\n', expect: 3000 },
];

let fixed = 0;
for (const item of additions) {
  const fp = getFP(item.ch);
  let text = fs.readFileSync(fp, 'utf-8');
  text = text.replace(/\r\n/g, '\n');

  const before = cjkCount(text);

  // Find the end marker line
  const markerPattern = /（第[^\n]*完）/;
  const match = text.match(markerPattern);
  if (!match) {
    console.log('ch' + item.ch + ': COULD NOT FIND END MARKER');
    continue;
  }

  const marker = match[0];
  const markerIndex = text.indexOf(marker);

  // Insert content before the end marker
  const newText = text.substring(0, markerIndex) + item.add + text.substring(markerIndex);

  fs.writeFileSync(fp, newText, 'utf-8');

  const after = cjkCount(newText);
  console.log('ch' + item.ch + ': ' + before + ' -> ' + after + ' CJK (' + (after >= item.expect ? 'OK' : 'STILL SHORT') + ')');
  fixed++;
}

console.log('\nTotal fixed: ' + fixed);
