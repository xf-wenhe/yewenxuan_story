const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // Gaze - R199 introduced
  '视线固定', '视线定住', '视线定着', '视线凝住', '视线不转',
  '目光定住', '目光定着', '目光凝住', '目光不转', '目光收住',
  '视线凝滞', '视线凝定', '视线凝住', '视线收住',
  '目光凝定', '目光凝滞', '目光收住',
  // Vocal - 声调
  '声调未变', '声调未改', '声调未移', '声调未动', '声调没变',
  // Vocal - 音色
  '音色低哑', '音色未改', '音色未变', '音色未动', '音色未移',
  '音色不变', '音色没改',
  // Vocal - 声线
  '声线低哑', '声线未改', '声线未变', '声线未动',
  // Vocal - 声音/嗓音
  '声音淡了', '声音变淡', '声音淡下', '声音淡去',
  '嗓音淡了', '嗓音变淡', '嗓音淡下', '嗓音淡去',
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

console.log('=== R200 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}