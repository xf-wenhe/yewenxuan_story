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

// Exact patterns to check
const exact = [
  '音量轻得几近无声。',
  '音量轻得几近无声。，',
  '音量轻得几乎听不见。',
  '音量轻得快要模糊。',
  '音量轻得快要消失。',
  '音量轻得好像要断掉。',
  '声音平稳。',
  '声音平稳而缺乏变化。',
  '声音平稳，',
  '声音低得几乎不可闻。',
  '声音低得几乎感觉不到。',
  '声音低得几乎听不见，',
  '声音低得无法察觉。',
  '声音低得听不真切。',
  '声音低得近乎无声。',
  '他还需要时间才能想明白。',
  '他还需要些时间才能理清。',
  '他还需要一会儿才行。',
  '韩冰开口，声音轻得',
  '韩冰开口，音量低得',
  '韩冰开口，声音压到了最低。',
];
for (const p of exact) {
  const c = allText.split(p).length - 1;
  if (c > 0) console.log(c + '\t' + p);
}