const fs = require('fs'), path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const allText = [];
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) allText.push(fs.readFileSync(path.join(d, f), 'utf-8'));
}
const combined = allText.join('\n');
function count(s) { return combined.split(s).length - 1; }

console.log('=== TARGETED VERIFICATION COUNTS ===');
const targets = [
  // 声音在叶文轩 consciousness patterns
  '声音在叶文轩的意识里',
  '声音在叶文轩的意识中',
  '声音在叶文轩的意识',
  '声音在叶文轩的脑',
  // 声音没有起伏
  '声音没有起伏',
  '声音没有起伏，',
  '声音没有感情',
  // 声音有些
  '声音有些颤抖',
  '声音有些沙哑',
  '声音有些低沉',
  '声音有些哑',
  '声音有些干涩',
  // 声音细得 similes
  '声音细得如同',
  '声音细得像',
  '声音细得几乎',
  // 嗓音低了下来
  '嗓音低了下来',
  '嗓音低下来',
  '嗓音低下去',
  '嗓音降低了',
  // 嗓音干涩得
  '嗓音干涩得',
  '嗓音干涩',
  // 声音，很
  '声音，很轻',
  '声音，很低',
  '声音，很冷',
  '声音，很沉',
  '声音，很淡',
  '声音，很平',
  // 声音很轻
  '声音很轻。',
  '声音很轻，',
  '声音很轻0428',
  // 嗓音稳定稳得 (doubled)
  '嗓音稳定稳得',
  '嗓音稳定稳',
  // 声音开始颤抖
  '声音开始颤抖',
  '声音开始发颤',
  '声音开始变',
  // 嗓音轻得 variants
  '嗓音轻得像要消散',
  '嗓音轻得几乎散在',
  '嗓音轻得即将飘散',
  '嗓音轻得快要融在',
  '嗓音轻得像要飘散',
  '嗓音轻得像要散在',
  // 嗓音颤抖
  '嗓音颤抖着',
  '嗓音颤抖，',
  '嗓音颤抖。',
  // 嗓音像砂
  '嗓音像砂砾',
  '嗓音像砂纸',
  '嗓音像砂子',
  '嗓音像磨砂',
];
for (const s of targets) {
  const c = count(s);
  if (c >= 1) console.log(`  ${s}: ${c}`);
}

// Also: how many 声音,很 instances are followed by common descriptors?
console.log('\n--- 声音，很 + descriptor ---');
for (const m of combined.matchAll(/声音，很(.)/g)) {
  const ctx = m[0];
  console.log(`  ${ctx}`);
}
