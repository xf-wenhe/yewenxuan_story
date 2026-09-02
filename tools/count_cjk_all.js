const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

let totalCJK = 0;
let below3000 = [];
let fileCount = 0;

for (const vol of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', vol);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const cjk = (text.match(/[一-鿿]/g) || []).length;
    totalCJK += cjk;
    fileCount++;
    if (cjk < 3000) below3000.push(`${vol}/${f}: ${cjk}`);
  }
}

console.log(`Files: ${fileCount}`);
console.log(`Total CJK: ${totalCJK}`);
console.log(`Below 3000: ${below3000.length}`);
if (below3000.length > 0) console.log(below3000.join('\n'));