const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  // gaze (newly introduced)
  '语气里', '嗓音里', '声调里', '音色里',
  '眼望去', '目光移向', '视线投向', '眼看去',
  '声线之中', '音色之中', '声音之中',
  '眼看向', '目光望去', '眼投去',
  '视线低下', '眼垂下', '目光垂下', '视线下垂',
  '睫毛垂下', '眼帘垂下', '眼睫低垂', '眼睫落下',
  '嗓音里带着', '声线中带着', '音色中带着', '声音中带着',
  '嗓音的底色', '声线的底色', '音色的底色', '声音的质感',
  // lingering
  '目光转去', '目光转向',
  '嗓音很轻', '声音轻得', '声音轻而淡', '嗓音低微',
  '声音透着', '声音之中', '语调之中',
  '嗓音发暗', '嗓音带暗', '嗓音喑哑', '嗓音闷哑',
  '目光钉在', '视线凝住', '眼停住',
  '目光顿住', '目光僵住', '视线顿住', '眼凝住', '目光凝在',
  // old patterns still around
  '视线扫', '眼神转', '眼神落', '眼神移', '目光扫', '眼神看向',
  '目光落向', '视线落向', '眼神望向',
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

console.log('=== R136 PROBE ===');
console.log('Top 35 concentrated patterns:');
for (let i = 0; i < Math.min(35, results.length); i++) {
  const r = results[i];
  const volStr = Object.entries(r.perVol).filter(([,v]) => v > 0).map(([k,v]) => `${k.slice(-1)}:${v}`).join(' ');
  console.log(`  ${r.total}.pad(4)}  "${r.pat}"  [${volStr}]`);
}