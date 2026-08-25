const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '嗓音喑哑', '嗓音低沉', '嗓音暗哑', '嗓音喑暗',
  '目光投向', '目光挪开', '目光停住', '目光移去',
  '语气无波', '语气不变', '语调平淡', '声调平淡',
  '语气无温', '语气冷然', '语气漠然', '语气寡淡',
  '声调不变', '声调未改', '声调平淡', '声调寡淡',
  '视线定住', '目光凝住', '目光锁住', '目光钉住',
  '目光投来', '目光凝住', '目光粘在', '目光投过',
  '目光锁住', '目光钉在', '视线钉在',
  '嗓音的底色', '声线的底色', '声音寡得', '声音发抖',
  '面无表情', '声音轻得', '声音微抖', '过了片刻',
  '声音的质地', '声音淡得', '声音颤动', '声音细得',
  '声调之外', '声调之内', '声调平白', '声调平白', '声调寡淡', '声调之间',
  '眼神凝定', '视线凝住', '视线定住',
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

console.log('=== R168 PROBE ===');
for (let i = 0; i < Math.min(50, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}