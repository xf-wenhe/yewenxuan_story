const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // R139 alts
  '声调之内', '声调之间', '声调之内里', '声调之间里',
  '嗓音带涩', '嗓音涩了', '嗓音涩哑', '嗓音发粗',
  '嗓音哑了下来', '嗓音喑哑', '嗓音嘶哑', '嗓音暗哑',
  '嗓音之内', '嗓音之间', '嗓音之内里', '嗓音之间里',
  '嗓音沉了下来', '嗓音压下去', '嗓音低了下去', '嗓音暗了下去',
  '视线锁定', '目光定住', '眼定住', '视线凝住',
  '目光凝定', '视线定住', '眼凝住', '目光定住不动',
  '声音的质地', '声音的质地里', '声音的底色', '声音里',
  // lingering
  '视线移去', '目光转开', '声音打颤', '声音颤抖',
  '声调平直', '目光粘在', '视线钉在',
  '嗓音的底色', '声线的底色', '声音弱得', '声音淡得',
  '声音薄得', '嗓音轻得', '声音微颤',
  '面无表情', '过了片刻', '目光投向', '眼望向',
  '目光停住', '目光凝定', '目光停泊', '目光停歇',
  '眼光移去', '眼光转向', '目光转去',
  '音色之内', '音色之间', '音色之内里', '音色之间里',
  '目光落点', '目光挪开', '目光离开',
  '嗓音带哑', '嗓音带暗色', '嗓音里带暗',
  '嗓音发闷', '嗓音带闷',
  '声调平淡', '声调寡淡', '声调无波',
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

console.log('=== R140 PROBE ===');
for (let i = 0; i < Math.min(45, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}