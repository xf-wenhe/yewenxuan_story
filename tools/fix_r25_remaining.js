const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

const pat = fromCodes([22235, 21608, 38745, 24471, 36830, 33258, 24049, 30340, 21628, 21560, 22768, 37117, 21548, 24471, 35265]);
const alt1 = fromCodes([22235, 21608, 23433, 38745, 19979, 26469, 65292, 36830, 21628, 21560, 22768, 37117, 21548, 24471, 28165, 28165, 26970, 26970]);
const chapters = [132, 332, 640];

for (const ch of chapters) {
  const vol = ch <= 100 ? 'volume-1' : ch <= 250 ? 'volume-2' : ch <= 400 ? 'volume-3' :
              ch <= 550 ? 'volume-4' : ch <= 750 ? 'volume-5' : ch <= 918 ? 'volume-6' : 'volume-7';
  const fp = path.join(process.cwd(), 'chapters', vol, 'chapter-' + String(ch).padStart(3, '0') + '-polished.md');
  let text = fs.readFileSync(fp, 'utf-8');
  text = text.replace(pat, alt1);
  fs.writeFileSync(fp, text, 'utf-8');
  console.log('Fixed ch' + ch);
}

// Final verification
const V = ['volume-1', 'volume-2', 'volume-3', 'volume-4', 'volume-5', 'volume-6', 'volume-7'];
let remaining = 0;
for (const v of V) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const t = fs.readFileSync(path.join(d, f), 'utf-8');
    remaining += t.split(pat).length - 1;
  }
}
console.log('Remaining H1 occurrences: ' + remaining);