const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // R157 alts
  '目光移开', '目光转向', '目光挪开', '目光移走',
  '声调之间', '声调里', '声调间', '声调之内',
  '视线定住', '视线凝滞', '视线凝住', '视线凝望',
  '目光投去', '目光投来', '目光落向', '目光投过',
  '目光定住', '目光凝住', '目光锁住', '目光钉在',
  '嗓音发涩', '嗓音发哑', '嗓音沙哑', '嗓音暗哑',
  '目光停定', '目光凝定',
  '声调之内',
  // R156 residuals
  '声调无波', '声调平淡', '声调平白', '声调平直', '声调寡淡',
  '眼望向', '视线移开', '视线离开',
  '目光钉住', '目光投向',
  '嗓音发涩', '嗓音哑了', '嗓音暗哑',
  // R155 residuals
  '声调无波', '声调平淡', '声调平白',
  '嗓音发涩', '嗓音哑了', '嗓音暗哑',
  // Others
  '视线钉在', '嗓音的底色', '声线的底色',
  '声音寡得', '声音发抖', '面无表情',
  '声音轻得', '声音微抖', '过了片刻',
  '目光粘在', '声音的质地', '声音淡得', '声音颤动',
  '声音细得', '目光定住',
  '目光静定', '目光落在',
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

console.log('=== R158 PROBE ===');
for (let i = 0; i < Math.min(50, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}