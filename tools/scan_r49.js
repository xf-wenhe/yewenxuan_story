const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const pats = [
  '声音轻得几乎消失。',
  '声音轻得快要消散。',
  '声音微弱得几乎听不见。',
  '音量轻得几乎听不见了。',
  '赵大嘴说话，嗓音粗哑。',
  '赵大嘴开口，嗓音沙哑。',
  '频率比以前明显升高。',
  '他还需要一些时间才能理清头绪。',
  '音量轻得几乎听不到。',
  '赵大嘴的声调平',
  '声音低得几乎',
  '赵大嘴说话嗓音沙哑',
  '赵大嘴声音有些哑，',
  '叶文轩的脑子在高速',
  '声音轻得几乎',
];

const counts = {};
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    for (const p of pats) {
      const c = text.split(p).length - 1;
      if (c > 0) counts[p] = (counts[p] || 0) + c;
    }
  }
}
for (const [p, c] of Object.entries(counts).sort((a,b)=>b[1]-a[1])) {
  console.log(c + '\t' + p);
}