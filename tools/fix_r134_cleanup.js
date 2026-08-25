const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

let total = 0;
for (const vol of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', vol);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const fp = path.join(d, f);
    let text = fs.readFileSync(fp, 'utf-8');
    const b1 = text.split('视线移向').length - 1;
    const b2 = text.split('声音里透着').length - 1;
    if (b1 || b2) {
      text = text.replace(/视线移向/g, '目光转去');
      text = text.replace(/声音里透着/g, '声音透着');
      fs.writeFileSync(fp, text, 'utf-8');
      total += b1 + b2;
    }
  }
}

let c1 = 0, c2 = 0;
for (const vol of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', vol);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const t = fs.readFileSync(path.join(d, f), 'utf-8');
    c1 += t.split('声音里').length - 1;
    c2 += t.split('视线移').length - 1;
  }
}
console.log('Cleanup: ' + total + ' strings replaced');
console.log('Remaining 声音里: ' + c1);
console.log('Remaining 视线移: ' + c2);