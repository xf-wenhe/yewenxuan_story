const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '嗓音喑哑', '嗓音喑然', '嗓音喑沉', '嗓音喑喑',
  '目光移去', '目光投向', '目光望过', '视线停住',
  '声调低平', '声调无波', '声调未改', '声调平缓', '声调不变',
  '声调平淡', '声调平白', '声调寡淡', '声调之外', '声调之内', '声调之间',
  '语调平淡', '语调平白',
  '语气无波', '语气冷淡', '语气无温', '语气冷然', '语气漠然', '语气寡淡',
  '语气不变', '语气未变', '语气未改', '语气低平', '语气平淡',
  '声音寡得', '声音发抖', '声音轻得', '声音微抖', '声音颤动', '声音细得', '声音淡得',
  '嗓音的底色', '声线的底色', '声音的质地',
  '视线定住', '视线凝定', '视线凝持', '视线凝望',
  '目光投向', '目光移去', '目光望过', '目光瞥向',
  '过了片刻', '面无表情',
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

console.log('=== R174 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}