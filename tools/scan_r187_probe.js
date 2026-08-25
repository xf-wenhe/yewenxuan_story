const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const candidates = [
  '音色低沉', '声调低沉', '嗓音低沉', '音色低弱',
  '声调低弱', '声音低弱', '嗓音低弱',
  '声调平适', '音色平展', '嗓音平展', '声音平适',
  '声调低缓', '音色低缓', '嗓音低缓', '声音低缓',
  '声调平淡', '语调平淡', '口吻平淡', '话音平淡',
  '嗓音震颤', '嗓音发震', '嗓音颤动', '声音颤动',
  '目光凝持', '眼神凝定', '注视凝望', '视线凝持',
  '视线锁定', '眼神锁定', '注视锁定', '目光紧锁',
  '视线凝定', '视线凝持',
  '声音细得', '声调未改', '嗓音发寡', '声音发寡',
  '语气冷然', '语气漠然', '语气不变', '语气无温',
  '语气寡淡', '语气未变', '语气未改', '语气低平',
  '面不改色', '神色不动', '面色无波', '面容平淡',
  '嗓音的质地', '声调的质地', '声色的质地',
  '声音发抖', '声音颤振',
  '声音淡了', '嗓音淡了', '话音淡得', '声音淡下',
  '音色底色', '声线底色', '嗓音底色', '声音底色',
  '音色质地', '声线质地',
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

console.log('=== R187 PROBE ===');
for (let i = 0; i < Math.min(60, results.length); i++) {
  const r = results[i];
  console.log(`  ${r.total.toString().padStart(4)}  "${r.pat}"`);
}