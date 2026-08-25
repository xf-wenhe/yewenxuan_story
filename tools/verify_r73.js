const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const sources = [
  '声音说话。', '声音说了句。。', '声音在叶文轩的耳边循环播放。',
  '声音轻得在抖。', '声音没有半点儿起伏波动。', '声音很轻，笑了笑。',
  '声音从头至尾一条直线。', '声音冷得像冰。',
  '声音颤抖不止。', '声音有点飘，"它在叫我。', '声音很模糊。像隔着一层水。像隔着一层时间。',
  '声音从远处传来，浪拍在沙滩上的声音。', '声音细得像游丝。。', '声音颤抖着。',
  '声音在0415碎片的最深层循环播放。', '声音压到了最低。'
];
for (const s of sources) {
  let total = 0;
  for (const v of VOLUMES) {
    const d = path.join(process.cwd(), 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      total += fs.readFileSync(path.join(d, f), 'utf-8').split(s).length - 1;
    }
  }
  console.log(total + '\t' + s);
}
