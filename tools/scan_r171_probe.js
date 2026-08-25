const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '嗓音发涩', '嗓音发哑', '嗓音发寒', '嗓音沙哑',
  '视线定住', '视线凝滞', '目光定住', '视线锁定',
  '目光扫向', '目光投向', '目光瞥向', '目光望过',
  '声调不变', '声调无波', '声调低平', '声调平白',
  '语调平淡', '声调平白',
  '目光停住', '目光锁住', '目光粘在', '目光投过',
  '目光钉住', '目光锁定', '目光钉在', '视线钉在',
  '嗓音的底色', '声线的底色', '声音寡得', '声音发抖',
  '面无表情', '声音轻得', '声音微抖', '过了片刻',
  '声音的质地', '声音淡得', '声音颤动', '声音细得',
  '声调之外', '声调之内', '声调平白', '声调之间',
  '眼神凝定',
  '语气不变', '语气冷然', '语气漠然', '语气无温', '语气寡淡',
  '语调平白', '语气未变', '语气未改', '语气低平', '语气平淡',
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

console.log('=== R171 PROBE ===');
for (let i = 0; i < Math.min(50, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}