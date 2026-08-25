const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '视线收紧', '目光固定', '注视收紧', '视线凝固',
  '音色低弱', '音色低哑', '音色低沉', '语调低缓',
  '嗓音低哑', '嗓音低沉', '声调低弱', '声音低弱',
  '声线低弱', '声线低沉',
  '嗓音颤动', '嗓音颤抖', '声音颤抖', '嗓音发抖',
  '声音发颤',
  '语调低缓',
  '视线凝望', '注视凝望', '注视凝定',
  '声音细得', '声调未改', '嗓音发寡', '声音发寡',
  '语气冷然', '语气漠然', '语气不变', '语气无温',
  '语气寡淡', '语气未变', '语气未改', '语气低平',
  '面不改色', '神色不动', '面色无波', '面容平淡',
  '嗓音的质地', '声调的质地', '声色的质地',
  '声音颤振',
  '声音淡了', '嗓音淡了', '话音淡得', '声音淡下',
  '音色底色', '声线底色', '嗓音底色', '声音底色',
  '音色质地', '声线质地',
  '声音低闷', '声调发闷', '嗓音低闷',
  '视线不移', '目光不移', '视线不放',
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

console.log('=== R189 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}