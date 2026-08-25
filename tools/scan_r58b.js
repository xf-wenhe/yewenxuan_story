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

// R58 target candidates
const exact = [
  '声音颤抖不已。',
  '声音抖个不停。',
  '声音抖得厉害。',
  '声音抖了起来。',
  '声音颤动了。',
  '声音抖动了。',
  '声音颤动着。',
  '声音颤着。',
  '声音发颤。',
  '声音颤抖着。',
  '声音颤了起来。',
  '声音颤了一下。',
  '声音抖了一下。',
  '声音颤个不停。',
  '声音颤抖不断。',
  '声音极低沉。',
  '声音低沉。',
  '声音低哑。',
  '声音沉。',
  '声音变了调子。',
  '声音变了样。',
  '声音发生了变化。',
  '声音的调变了。',
  '声音稳。',
  '声音极稳。',
  '声音平稳。',
  '声音稳如磐石。',
  '声音沙哑。',
  '声音哑了。',
  '声音嘶哑。',
  '声音发哑。',
  '声音沙哑得厉害。',
  '声音像被砂纸磨过一般。',
  '声音像是被砂砾磨过。',
  '声音压得很低。',
  '声音有点抖。',
  '声音很小。',
  '声音异常沙哑。',
  '声音干涩而沙哑。',
  '叶文轩的声音平稳。',
  '叶文轩的声音在回廊中回荡。',
];

console.log('=== R58 CANDIDATE SCAN ===');
for (const p of exact) {
  const c = allText.split(p).length - 1;
  if (c > 0) console.log(c + '\t' + p);
}