const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '声线低缓', '声线低弱', '声线低沉', '声线平展',
  '嗓音震颤', '嗓音发震', '嗓音颤振', '嗓子颤振',
  '音色底色', '声线底色', '嗓音底色', '声音底色',
  '音色质地', '声线质地', '音色低缓', '音色低弱',
  '声音低缓', '声音低弱', '声音低沉', '声音平展',
  '音色淡了', '声线淡了', '音色未改', '音色不变',
  '嗓音淡了', '声调淡了', '声线变了', '声线未变',
  '视线锁定', '眼神锁定', '注视锁定', '目光紧锁',
  '视线凝望', '视线凝持', '视线凝定', '目光凝持',
  '声音细得', '声调未改', '嗓音发寡', '声音发寡',
  '语气冷然', '语气漠然', '语气不变', '语气无温',
  '语气寡淡', '语气未变', '语气未改', '语气低平',
  '面不改色', '神色不动', '面色无波', '面容平淡',
  '声音的底色', '声色的底色', '声音的质地',
  '嗓音的质地', '声调的质地', '声色的质地',
  '声音发抖', '声音颤振',
  '语气平淡', '声调平白', '口吻平淡', '语调平白',
  '声音淡了', '嗓音淡了', '话音淡得', '声音淡下',
  '声音发颤', '话音发颤', '嗓子发抖',
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

console.log('=== R186 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}