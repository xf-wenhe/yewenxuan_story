const fs = require('fs'), path = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const CHANGES_DIR = process.cwd();

const PATTERNS = ['心脏猛地','猛地一跳','猛地一沉','喉咙动了','面无表情'];
const ALTS = ['心脏骤然','心脏陡然','心脏忽然','心脏猛然','心脏渐渐','心脏慢慢',
  '骤然一跳','陡然一跳','忽然一跳','猛然一跳','瞬间一跳','猛地一颤','猛地一僵','猛地一震',
  '骤然一沉','陡然一沉','忽然一沉','猛然一沉','猛地一缩',
  '他清了清喉','喉间动了动','喉头动了动','喉间滚了滚','他清了清喉咙','他清了清喉间',
  '没有半分表情','脸上没有表情','脸上表情不变','脸上神情不变','脸上神色不变'];

let totalCjk = 0, below = 0, totalFiles = 0;
for (const v of V) {
  const d = path.join(CHANGES_DIR, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const t = fs.readFileSync(path.join(d, f), 'utf-8');
    totalFiles++;
    let c = 0;
    for (const ch of t) if (ch >= '一' && ch <= '鿿') c++;
    totalCjk += c;
    if (c < 3000) below++;
  }
}

console.log('=== VERIFICATION ===');
console.log('Files: ' + totalFiles);
console.log('Total CJK: ' + totalCjk.toLocaleString());
console.log('Below 3000: ' + below);

let remaining = 0;
for (const p of PATTERNS) {
  let cnt = 0;
  for (const v of V) {
    const d = path.join(CHANGES_DIR, 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      const t = fs.readFileSync(path.join(d, f), 'utf-8');
      cnt += t.split(p).length - 1;
    }
  }
  console.log('  Remaining ' + p + ': ' + cnt);
  remaining += cnt;
}
console.log('  Total remaining patterns: ' + remaining);

let altTotal = 0;
for (const a of ALTS) {
  let cnt = 0;
  for (const v of V) {
    const d = path.join(CHANGES_DIR, 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      const t = fs.readFileSync(path.join(d, f), 'utf-8');
      cnt += t.split(a).length - 1;
    }
  }
  altTotal += cnt;
}
console.log('  Total alt instances in text: ' + altTotal);