const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '目光移去', '视线落定', '目光凝住', '视线凝住',
  '嗓音发寒', '嗓音发哑', '嗓音低哑', '嗓音发涩',
  '视线凝锁', '视线凝望', '视线凝持', '视线凝定',
  '语调平淡', '语调平白',
  '声音寡得', '声音发抖', '声音轻得', '声音微抖', '声音颤动', '声音细得', '声音淡得',
  '嗓音的底色', '声线的底色', '声音的质地',
  '声调低平', '声调无波', '声调未改', '声调平缓',
  '面无表情', '过了片刻',
  '语气冷然', '语气漠然', '语气不变', '语气无温', '语气寡淡',
  '语气未变', '语气未改', '语气低平', '语气平淡',
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

console.log('=== R179 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}