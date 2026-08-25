const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const textAll = [];
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    textAll.push(fs.readFileSync(path.join(d, f), 'utf-8'));
  }
}
const allText = textAll.join('\n');

// R57 candidate scan
const exact = [
  // R56 alternatives
  '声音在颤。',
  '声音在发颤。',
  '声音在颤动。',
  '声音在发抖。',
  '声音很低。',
  '声音很小。',
  '声音很淡。',
  '声音很细小而短。',
  '声音很轻细。',
  '声音很细小而模糊。',
  '声音极弱。',
  '声音极轻细。',
  '声音极轻小。',
  '声音极轻而短。',
  '声音轻得发抖。',
  '声音轻得颤。',
  '声音轻而颤动。',
  '声音轻得在抖。',
  '叶文轩的声线里听不到一丝波动。',
  '叶文轩的声线里听不出一点变化。',
  '叶文轩的声线里听不见半分波澜。',
  '叶文轩的声线里没有任何起伏。',
  '叶文轩说话时语气平淡得不像活人。',
  '叶文轩说话时语气平淡得没有感情。',
  '叶文轩说话时语气平淡得像机器。',
  '叶文轩说话时语气平淡得让人发冷。',
  '叶文轩的声调平稳得几乎冷淡。',
  '叶文轩的声调平稳得近乎漠然。',
  '叶文轩的声调平稳得像没有情绪。',
  '叶文轩的声调平稳得让人感觉不到情感。',
  // broader
  '声音沙哑得厉害。',
  '声音有点哑。',
  '声音有些哑。',
  '声音有点抖。',
  '声音压得很低。',
  '声音停了。',
  '声音停了。。。',
  '声音停了。。',
  '声音变了。',
  '声音提高了。',
  '声音平稳。',
  '声音简短。',
  '声音很稳。',
];

console.log('=== R57 CANDIDATE SCAN ===');
for (const p of exact) {
  const c = allText.split(p).length - 1;
  if (c > 0) console.log(c + '\t' + p);
}