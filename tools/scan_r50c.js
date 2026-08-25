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

// Check specific exact matches
const exact = [
  '声音轻得几乎消散。',
  '声音轻得几乎消散，',
  '声音轻得几乎消散在空气里。',
  '声音轻得几乎听不到。',
  '声音轻得几乎飘散。',
  '声音低得几乎无法感知。',
  '声音低得几乎无法感知。，',
  '声音低得几乎听不到。',
  '声音低得几乎察觉不到。',
  '声音低得几乎听不见，',
];
for (const p of exact) {
  const c = allText.split(p).length - 1;
  if (c > 0) console.log(c + '\t' + p);
}