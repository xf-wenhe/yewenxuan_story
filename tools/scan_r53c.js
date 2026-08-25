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

// Check exact 韩冰 patterns
const exact = [
  '韩冰开口，声音轻得近乎消散。',
  '韩冰开口，声音轻得快要模糊。',
  '韩冰开口，声音轻得快要飘走。',
  '韩冰开口，音量低得几乎不可闻。',
  '韩冰开口，声音压到了最低。',
  '声音平稳而缺乏变化。',
  '声音平稳而缺乏变化。，',
  '声音平稳。',
  '音量轻得几近无声。',
  '音量轻得几近无声。，',
];
for (const p of exact) {
  const c = allText.split(p).length - 1;
  if (c > 0) console.log(c + '\t' + p);
}