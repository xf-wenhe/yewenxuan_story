// second_pass.js — Re-run batch_fix on the 34 partial chapters
const { execSync } = require('child_process');
const path = require('path');

const ROOT = 'D:\\work\\yewenxuan_story';
const BATCH_FIX = path.join(ROOT, 'tools', 'batch_fix.js');
const PARTIALS = [66, 68, 69, 90, 99, 113, 122, 172, 221, 242, 249, 255, 256, 259, 300, 301, 302, 303, 306, 307, 311, 312, 320, 332, 340, 369, 377, 383, 397, 402, 511, 524, 564, 588];

let fixed = 0;
let stillPartial = 0;
const stillPartialList = [];

console.log(`Second pass on ${PARTIALS.length} chapters...`);

for (const ch of PARTIALS) {
  try {
    execSync(`node "${BATCH_FIX}" ${ch}`, { cwd: ROOT, timeout: 60000, stdio: 'pipe' });
    stillPartial++;
    stillPartialList.push(ch);
  } catch (e) {
    fixed++;
  }
}

console.log(`\nFixed this pass: ${fixed}`);
console.log(`Still partial: ${stillPartial}`);
if (stillPartialList.length > 0) {
  console.log(`Chapters: ${stillPartialList.join(', ')}`);
}