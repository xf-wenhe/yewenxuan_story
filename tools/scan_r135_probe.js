const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '目光投向', '视线垂下', '眼睫垂下', '眼望向',
  '嗓音中带着', '嗓音之中', '声音的底色', '语调里',
  '目光顿住', '视线凝住', '眼停住', '目光钉在',
  '目光转去', '目光转向', '眼看向',
  '嗓音很轻', '声音轻得', '声音轻而淡', '嗓音低微',
  '声音透着', '声音之中', '语调之中',
  '嗓音发暗', '嗓音带暗', '嗓音喑哑', '嗓音闷哑',
  '目光僵住', '视线顿住', '眼凝住', '目光凝在',
  // gaze
  '眼神转', '眼神落', '眼神移', '目光扫', '眼神看向',
  '目光落向', '视线落向', '眼神望向', '视线扫',
  // voice
  '声音低轻', '声音平实', '声音寡淡', '声音无波', '声音淡平',
  '嗓音压到极限', '嗓音几近消失', '嗓音低到极限', '嗓音压到深处',
  '嗓音发嘶', '嗓音带嘶', '嗓音嘶涩', '嗓音发涩',
  '声音打颤', '声音颤抖', '声音微颤', '声音震颤',
  // feeling
  '心里涌起', '胸中涌起', '心底涌起', '心中泛起', '心底泛起',
  '心头涌起', '胸口涌起',
  // body
  '手指微微', '手指轻轻', '手指缓缓',
  '身体绷紧', '身体僵硬', '全身僵硬',
  '手心出汗', '手心发潮', '掌心出汗', '掌心发潮',
  // pacing
  '面无表情', '脸上没有任何表情', '神情没有变化',
  '面无表情地说', '面无表情地开口',
  '过了一会儿', '过了片刻', '片刻之后',
  '停顿了一会儿', '停顿片刻', '沉默了一会儿', '沉默片刻', '安静了一会儿',
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

console.log('=== R135 PROBE ===');
console.log('Top 30 concentrated patterns:');
for (let i = 0; i < Math.min(30, results.length); i++) {
  const r = results[i];
  const volStr = Object.entries(r.perVol).filter(([,v]) => v > 0).map(([k,v]) => `${k.slice(-1)}:${v}`).join(' ');
  console.log(`  ${r.total}.pad(4)}  "${r.pat}"  [${volStr}]`);
}