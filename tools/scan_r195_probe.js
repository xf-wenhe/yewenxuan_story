const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // Vocal - 声调 variants
  '声调低闷', '声调低哑', '声调低弱', '声调未改', '声调未变', '声调不变',
  '声调淡了', '声调淡去', '声调淡下', '声调变淡',
  // Vocal - 音色 variants
  '音色低弱', '音色低闷', '音色低哑', '音色淡了', '音色淡去', '音色变淡',
  // Vocal - 声线 variants
  '声线低闷', '声线低弱', '声线低哑', '声线淡了',
  // Vocal - 声音/嗓音/嗓子
  '声音淡了', '声音变淡', '嗓音淡了', '嗓音变淡', '嗓音发淡',
  '声音淡下', '嗓音淡下',
  // Gaze - 目光 variants
  '目光凝滞', '目光不转', '目光凝定', '目光凝住', '目光收住', '目光凝定',
  '目光不瞬', '目光未动', '目光未移',
  // Gaze - 视线 variants
  '视线凝定', '视线固定', '视线凝滞', '视线凝住', '视线收住',
  '视线未移', '视线未动',
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

console.log('=== R195 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}