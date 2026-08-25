const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '语调低缓', '语调低弱', '语调低哑',
  '声调低弱', '声调低缓', '声调低哑',
  '视线固定', '视线凝住', '视线凝定',
  '音色低缓', '音色低弱', '音色低闷',
  '视线不移', '视线收住', '视线凝固',
  '嗓音颤抖', '嗓音发颤', '嗓子发颤',
  '声线低弱', '声线低哑', '声线低闷',
  '目光不移', '目光凝定', '目光不转',
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

console.log('=== R192 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}