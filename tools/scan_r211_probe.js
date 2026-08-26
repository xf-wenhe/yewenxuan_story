const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // Gaze remaining
  '目光定着', '目光凝滞', '目光凝住', '目光收住',
  // Vocal - 声调
  '声调不变', '声调未变', '声调未移', '声调未动',
  // Vocal - 音色
  '音色未改', '音色不变', '音色未动', '音色未移', '音色没改', '音色低沉',
  // Vocal - 声线
  '声线低哑', '声线未改', '声线未变', '声线未动',
  // Vocal - 声音/嗓音
  '声音淡了', '声音变淡', '声音淡下', '声音淡去', '声音低哑', '嗓音低哑',
  '嗓音淡了', '嗓音变淡', '嗓音淡下', '嗓音淡去',
  // Vocal - 语调
  '语调未改', '语调未变', '语调不变', '语调未动', '语调没改',
  // Vocal - 语气
  '语气未改', '语气未变', '语气不变', '语气未动', '语气没改',
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

console.log('=== R211 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}