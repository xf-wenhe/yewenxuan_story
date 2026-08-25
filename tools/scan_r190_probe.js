const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '嗓音低哑', '声调低沉', '音色低沉', '声音低沉',
  '视线定格', '目光停留', '视线不移', '目光收住',
  '目光定格', '视线停留', '目光不移',
  '注视定格',
  '声调低缓', '声线低缓', '语调低弱', '音色低弱',
  '声线低沉',
  '嗓音颤抖', '嗓音发抖', '声音颤抖', '声音发颤',
  '音色低哑', '音色低沉',
  '声音细得', '声调未改', '嗓音发寡', '声音发寡',
  '语气冷然', '语气漠然', '语气不变', '语气无温',
  '语气寡淡', '语气未变', '语气未改', '语气低平',
  '面不改色', '神色不动', '面色无波', '面容平淡',
  '嗓音的质地', '声调的质地', '声色的质地',
  '声音颤振',
  '声音淡了', '嗓音淡了', '话音淡得', '声音淡下',
  '音色底色', '声线底色', '嗓音底色', '声音底色',
  '音色质地', '声线质地',
  '声调发闷', '声音发闷', '嗓音发闷',
  '视线不放', '目光不转', '视线不移',
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

console.log('=== R190 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}