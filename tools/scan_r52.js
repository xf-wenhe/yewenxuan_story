const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const textAll = [];
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    textAll.push(fs.readFileSync(path.join(d, f), 'utf-8'));
  }
}
const allText = textAll.join('\n');

const exact = [
  '音量低到几乎无声。',
  '音量低得几乎听不到。',
  '音量低得几乎听不到。，',
  '音量低到几乎听不到。',
  '音量轻得几乎听不清。',
  '音量轻得几乎消失。',
  '音量轻得几乎听不见。',
  '他还需要一点时间才能弄懂。',
  '他还需要些时间。',
  '他还需要些时间才能弄通。',
  '他还需要些时间才能弄懂。',
  '他还需要一点时间才能弄通。',
  '音量低到难以分辨。',
  '音量低到几近无声。',
];
for (const p of exact) {
  const c = allText.split(p).length - 1;
  if (c > 0) console.log(c + '\t' + p);
}