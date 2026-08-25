const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // R138 alternatives introduced
  '音色之内', '音色之间', '音色之内里', '音色之间里',
  '目光定住', '目光凝定', '目光定住不动', '目光停住',
  '嗓音发哑', '嗓音哑了', '嗓音带哑', '嗓音暗哑',
  '声调平淡', '声调寡淡', '声调无波', '声调平直',
  '嗓音发暗', '嗓音暗了下去', '嗓音里带暗', '嗓音带暗色',
  '嗓音发闷', '嗓音带闷',
  '视线落在', '目光停泊', '目光停歇', '目光落点',
  '目光挪开', '视线移去', '目光离开', '眼光移去',
  // lingering
  '目光投向', '眼望向', '眼停住', '视线定在',
  '目光粘在', '视线凝在', '视线钉在',
  '嗓音之中', '声调之中', '音色之中', '声调里',
  '嗓音带暗', '嗓音喑哑', '嗓音发涩', '嗓音闷哑',
  '目光转去', '眼光转向', '目光转开',
  '嗓音含着', '声线含着', '音色含着',
  '声音的质感', '嗓音的底色', '声线的底色',
  '声音淡得', '声音弱得', '嗓音轻得', '声音薄得',
  '声音打颤', '声音颤抖', '声音微颤',
  '面无表情', '神情没有变化', '过了片刻',
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

console.log('=== R139 PROBE ===');
for (let i = 0; i < Math.min(40, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}