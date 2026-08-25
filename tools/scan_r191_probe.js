const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '目光停留', '目光收住', '目光不转', '目光固定',
  '视线停留', '视线不移', '视线固定', '视线收住',
  '音色低哑', '音色低缓', '音色低闷',
  '声调低缓', '声调低弱', '声调低哑', '声调低闷',
  '声线低缓', '声线低弱', '声线低哑',
  '语调低弱', '语调低缓', '语调低哑',
  '声音发颤', '嗓音发颤', '嗓音颤动', '嗓音颤抖',
  '嗓子发颤', '嗓子颤动',
  '目光停留', '目光不移', '目光凝住',
  '注视定格', '注视不放',
  '嗓音低哑', '声音低沉',
];

const results = [];
for (const pat of candidates) {
  let total = 0;
  for (const vol of VOLUMES) {
    const d = path.join(process.cwd(), 'chapters', vol);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      const text = fs.readFileSync(path.join(d, f), 'utf-8');
      const cnt = text.split(pat).length - 1;
      if (cnt > 0) total += cnt;
    }
  }
  if (total > 0) results.push({ pat, total });
}
results.sort((a, b) => b.total - a.total);

console.log('=== R191 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}