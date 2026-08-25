const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // newly introduced (R137 alts)
  '声调之中', '声调里', '音色之中', '嗓音之中',
  '目光投向', '眼投向', '眼望向', '目光投去',
  '目光移去', '眼光转去', '视线移去', '眼光移去',
  '嗓音带暗', '嗓音喑哑', '嗓音发涩', '嗓音闷哑',
  '目光转开',
  // lingering from previous rounds
  '目光落在', '视线定在', '眼落向', '视线凝在',
  '视线钉在', '目光粘在',
  '眼定住', '眼凝住', '眼停定', '眼定格',
  '视线定住', '目光凝住', '视线定格', '视线凝定',
  '嗓音里带着', '声线中带着', '音色中带着', '声音中带着',
  '嗓音的底色', '声线的底色', '音色的底色', '声音的质感',
  '声音中含着', '声音含着', '嗓音透着', '声线透着',
  '声音淡得', '声音弱得', '嗓音轻得', '声音薄得',
  '目光凝在', '眼停住', '目光顿住',
  '视线扫', '目光扫', '眼神转', '眼神落', '眼神移',
  '眼神看向', '眼神望向',
  '声音低轻', '声音平实', '声音寡淡', '声音无波', '声音淡平',
  '嗓音压到极限', '嗓音几近消失', '嗓音低到极限', '嗓音压到深处',
  '嗓音发嘶', '嗓音带嘶', '嗓音嘶涩', '嗓音发涩',
  '声音打颤', '声音颤抖', '声音微颤', '声音震颤',
  '面无表情', '脸上没有任何表情', '神情没有变化',
  '过了一会儿', '过了片刻', '片刻之后',
];

const results = [];
for (const pat of candidates) {
  let total = 0;
  const perVol = {};
  for (const vol of VOLUMES) perVol[vol] = 0;
  for (const vol of VOLUMES) {
    const d = path.join(process.cwd(), 'chapters', vol);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      const text = fs.readFileSync(path.join(d, f), 'utf-8');
      const cnt = text.split(pat).length - 1;
      if (cnt > 0) { total += cnt; perVol[vol] += cnt; }
    }
  }
  if (total > 0) results.push({ pat, total, perVol });
}

results.sort((a, b) => b.total - a.total);

console.log('=== R138 PROBE ===');
for (let i = 0; i < Math.min(35, results.length); i++) {
  const r = results[i];
  const volStr = Object.entries(r.perVol).filter(([,v]) => v > 0).map(([k,v]) => `${k.slice(-1)}:${v}`).join(' ');
  console.log(`  ${r.total}.pad(4)}  "${r.pat}"  [${volStr}]`);
}