const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // R154 alts
  '声调间', '声调里', '声调中', '声调之外',
  '目光凝滞', '目光定住', '目光停住', '目光停定',
  '眼定住', '眼凝定', '视线定住', '视线移开',
  '目光投向', '视线离开',
  '声调之间', '声调之内',
  '嗓音沙哑', '嗓音发涩', '嗓音带涩', '嗓音暗哑',
  // R153 residuals
  '声调无波', '声调平淡', '声调平白',
  '声调平直', '声调寡淡',
  '目光钉住', '眼望向', '目光移去', '视线凝定',
  '嗓音哑了',
  '视线钉在', '嗓音的底色', '声线的底色',
  '声音寡得', '声音发抖', '面无表情',
  '声音轻得', '声音微抖', '过了片刻',
  '目光粘在', '声音的质地', '声音淡得', '声音颤动',
  '声音细得',
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

console.log('=== R155 PROBE ===');
for (let i = 0; i < Math.min(50, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}