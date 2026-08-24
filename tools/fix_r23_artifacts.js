const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// Fix charCode errors from R23: 排得 (ch25490) should have been 挤得 (ch25490 is 排; 25490+1=25490? no)
// 排 = U+6392 = 25490; 挤 = U+6324 = 25380; 提 = U+63d0 = 25552; 技 = U+6280 = 25216
// Wrong: 排得(25490,24471) = 排得; should be 挤得(25380,24471)
// Wrong: 技起(25216,36215) = 技起; should be 提起(25552,36215)

const pd = fromCodes([25490,24471]);   // 排得 (artifact)
const zhe = fromCodes([25380,24471]);   // 挤得 (correct)
const jq = fromCodes([25216,36215]);    // 技起 (artifact)
const tq = fromCodes([25552,36215]);    // 提起 (correct)

// Targeted R23 artifacts in 攥得→排得
// All instances where the surrounding context shows a gripping action:
const fixes = [
  // ch209: 他握紧拳手指。排得动。 -> 挤得动
  [60, null], // chapter-049 etc are legitimate "排得整齐" — skip
  // ch209 specific: context has 握紧拳手指
  [209, '排得动', '挤得动'],
  [248, '攥在手里，排得掌心', '攥在手里，挤得掌心'],
  [249, '石子攥在手心里，排得很紧', '石子攥在手心里，挤得很紧'],
  [369, '女儿的小手攥着他，排得很紧', '女儿的小手攥着他，挤得很紧'],
  [376, '手攥着潜水笼的门把手，排得很紧', '手攥着潜水笼的门把手，挤得很紧'],
  [378, '她把爸爸的手排得更紧', '她把爸爸的手挤得更紧'],
  [382, '攥着，排得很紧', '攥着，挤得很紧'],
  [385, '她的手攥着，排得很紧', '她的手攥着，挤得很紧'],
  [395, '手指握住了衣角，排得很紧', '手指握住了衣角，挤得很紧'],
  [457, '两只手排得更紧', '两只手攥得更紧'],
  [460, '排得越紧，流失得越快', '攥得越紧，流失得越快'],
  [551, '握紧了叶文轩的手臂，手指排得发僵', '握紧了叶文轩的手臂，手指攥得发僵'],
  // 技起 → 提起
  [381, '技起', '提起'],
];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

const VOLUMES = ["volume-1","volume-2","volume-3","volume-4","volume-5","volume-6","volume-7"];

for (const [chNum, oldStr, newStr] of fixes) {
  if (!oldStr) continue;
  const vol = chNum <= 100 ? "volume-1" : chNum <= 250 ? "volume-2" : chNum <= 400 ? "volume-3" :
              chNum <= 550 ? "volume-4" : chNum <= 750 ? "volume-5" : chNum <= 918 ? "volume-6" : "volume-7";
  const fp = path.join(process.cwd(), 'chapters', vol, 'chapter-' + String(chNum).padStart(3,'0') + '-polished.md');
  let text = fs.readFileSync(fp, 'utf-8');
  const before = countCjk(text);
  const oldRe = new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const newCount = (text.match(oldRe) || []).length;
  text = text.replace(oldRe, newStr);
  const after = countCjk(text);
  if (after !== before) {
    console.log('ch' + chNum + ': no CJK change (expected for same-length replacement) — chars: ' + oldStr.length + ' vs ' + newStr.length);
  }
  fs.writeFileSync(fp, text, 'utf-8');
  console.log('ch' + chNum + ': replaced "' + oldStr + '" -> "' + newStr + '" (count: ' + newCount + ')');
}

console.log('\nDone. Verifying fixes...');
for (const [chNum, oldStr] of fixes.filter(f => f[1])) {
  const vol = chNum <= 100 ? "volume-1" : chNum <= 250 ? "volume-2" : chNum <= 400 ? "volume-3" :
              chNum <= 550 ? "volume-4" : chNum <= 750 ? "volume-5" : chNum <= 918 ? "volume-6" : "volume-7";
  const fp = path.join(process.cwd(), 'chapters', vol, 'chapter-' + String(chNum).padStart(3,'0') + '-polished.md');
  const text = fs.readFileSync(fp, 'utf-8');
  const remain = text.split(oldStr).length - 1;
  if (remain > 0) console.log('  STILL PRESENT in ch' + chNum + ': "' + oldStr + '" x' + remain);
}
