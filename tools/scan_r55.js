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

// R55 candidate scan - R54 alternatives + new patterns
const exact = [
  '声音冷得没有半分温度。',
  '声音里没有一丝暖意。',
  '声音冷得像冰。',
  '声音冷得让人打颤。',
  '声音平静而平淡。',
  '声音平淡而没有任何波澜。',
  '声音平静得像没有情绪。',
  '声音平静得像一潭水。',
  '叶文轩将声音压到最低点。',
  '叶文轩把音量压到了极限。',
  '叶文轩的声音压到了最低。',
  '叶文轩将声音压到了最低处。',
  '叶文轩将声音压得更低。',
  '叶文轩的音量压到了更低。',
  '叶文轩的声音被压得更低。',
  '叶文轩把音量又压了一档。',
  '弄懂还需要些时间。',
  '他需要更多时间才能弄懂。',
  '想弄懂还需要些时间。',
  '弄懂这些还需要些时间。',
  '弄通还需要些时间。',
  '他需要时间才能弄通。',
  '想弄通还需要时间。',
  '弄通这些还需要些时间。',
  '弄懂需要时间。',
  '他需要时间才能弄懂。',
  '弄懂这些还需要时间。',
  '他需要点时间才能弄懂。',
  '想通还需要些时间。',
  '他需要时间才能想通。',
  '想通这些还需要时间。',
  '他需要点时间才能想通。',
  // broader patterns
  '声音细若游丝。',
  '声音压到最低。',
  '声音压得极低。',
  '声音压得更低。',
  '叶文轩说话，声音几乎消散在空气里。',
  '叶文轩说话时声音微不可闻。',
  '叶文轩的声音细如蚊呐。',
  '叶文轩的声音平直没有任何波澜。',
  '叶文轩的声音平稳而毫无波澜。',
  '叶文轩的声音平稳得像流水没有变化。',
  '叶文轩的声音平淡得像一条直线。',
  '声音像被砂纸磨过一般。',
  '声音像是被砂砾磨过。',
  '声音有点抖。',
  '声音有些不确定。',
  '声音有些发紧。',
  '声音有些发颤。',
  '声音有些紧张。',
  '声音有些颤抖。',
  '声音很平。',
  '声音很轻。',
];

console.log('=== R55 CANDIDATE SCAN ===');
for (const p of exact) {
  const c = allText.split(p).length - 1;
  if (c > 0) console.log(c + '\t' + p);
}