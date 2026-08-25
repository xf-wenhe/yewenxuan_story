const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // R149 alts
  '目光凝滞', '眼停住', '目光停住', '目光钉住',
  '声调中', '声调间', '声调里', '声调之外',
  '声调平淡', '声调寡淡', '声调平直', '声调平白',
  '嗓音发粗', '嗓音发涩', '嗓音带涩', '嗓音暗哑',
  '视线定住', '目光凝定', '视线凝住', '眼凝定',
  // R148 alts still circulating
  '目光定住', '目光定住不动', '眼定住',
  '声调之间', '声调无波', '声调之内',
  '嗓音哑了', '嗓音沙哑',
  '视线凝定',
  // Other accumulated
  '声调之内', '嗓音沙哑', '嗓音哑了',
  '视线钉在', '嗓音的底色', '声线的底色',
  '声音寡得', '声音发抖', '面无表情',
  '眼停住', '目光移去', '声音轻得', '声音微抖',
  '过了片刻', '目光粘在', '声音的质地',
  '声调间', '嗓音带涩', '视线移开', '声音淡得', '声音颤动',
  '声音细得', '目光投向', '眼望向', '视线离开',
  '声音的质地里', '声音的底色', '声音里',
  '音色之内', '音色之间',
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

console.log('=== R150 PROBE ===');
for (let i = 0; i < Math.min(50, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}