const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // R145 alts
  '声调中', '声调间', '声调之外', '声调间里',
  '嗓音发粗', '嗓音带涩', '嗓音哑了', '嗓音暗哑',
  '嗓音涩了', '嗓音发粗',
  '眼定住', '眼凝滞', '目光停住', '眼停定',
  '声调平淡', '声调寡淡', '声调无波', '声调平直',
  '声调之间',
  '声音的质地', '声音的质地里', '声音的底色', '声音里',
  '目光定定',
  '眼停定', '眼凝滞', '眼凝滞', '眼停住', '眼定住',
  '目光停住', '目光定住', '视线凝住', '视线凝住不动',
  '声音寡得', '声音发抖', '面无表情', '视线钉在',
  '嗓音的底色', '声线的底色',
  '声音轻得', '声音淡得', '声音微抖', '声音颤动',
  '声音细得',
  '目光钉住',
  '目光粘在', '视线钉在',
  '音色之内', '音色之间', '音色之内里', '音色之间里',
  '嗓音带哑', '嗓音带暗色', '嗓音里带暗',
  '嗓音发闷', '嗓音带闷',
  '视线定在', '目光定住', '视线定住',
  '目光停泊', '目光锁定', '视线固定', '视线钉住',
  '目光投向', '眼望向', '目光停歇', '目光落点',
  '过了片刻',
  '嗓音涩哑哑', '嗓音沙哑哑',
  '目光移去', '视线移开', '视线离开', '目光凝滞',
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

console.log('=== R146 PROBE ===');
for (let i = 0; i < Math.min(50, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}