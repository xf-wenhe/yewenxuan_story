const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '视线锁定', '眼神锁定', '注视锁定', '目光紧锁',
  '声音发颤', '嗓音发颤', '话音发颤', '嗓子发颤',
  '声调低缓', '声调低弱', '声调低沉', '声调平低',
  '声调平直', '声调无起', '声调无伏', '声调平稳',
  '声调平柔', '声调平弱', '声调持平',
  '过了一阵', '过了一瞬', '过了些时', '过了不久',
  '嗓音的质地', '声色的质地', '声色的底色', '嗓音的底色',
  '声色的底色', '嗓音的底色', '声线的质地', '嗓音的质地',
  '声音颤动', '声音淡得', '视线凝望', '视线凝持', '视线凝定',
  '声音细得', '声调未改', '语调平白',
  '语气冷然', '语气漠然', '语气不变', '语气无温', '语气寡淡',
  '语气未变', '语气未改', '语气低平', '语气平淡',
  '声音发寡', '嗓音发寡', '话音发寡', '语气发寡',
  '面不改色', '神色不动', '面色无波', '面容平淡',
  '声色的底色', '声音的底色', '声色的质地', '声音的质地',
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

console.log('=== R184 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}