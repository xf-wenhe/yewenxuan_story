#!/usr/bin/env node
/* fix_endmarker_position.js — Move end marker to the very last line for ch693,694,695,732 */

const fs = require('fs');

const targets = [
  ['chapters/volume-5/chapter-693-polished.md', 693],
  ['chapters/volume-5/chapter-694-polished.md', 694],
  ['chapters/volume-5/chapter-695-polished.md', 695],
  ['chapters/volume-5/chapter-732-polished.md', 732],
];

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

for (const [fp, num] of targets) {
  let text = fs.readFileSync(fp, 'utf-8');

  const marker = '（第' + num + '章完）';
  const idx = text.indexOf(marker);
  if (idx < 0) {
    console.log('ch' + num + ': marker not found');
    continue;
  }

  const before = text.slice(0, idx);
  const after = text.slice(idx + marker.length);

  // Strip trailing whitespace before marker
  const trimmedBefore = before.replace(/\s+$/, '');
  // Strip all padding after marker
  const padContent = after.trim();

  if (!padContent) {
    console.log('ch' + num + ': no trailing content, nothing to fix');
    continue;
  }

  // Reconstruct: content + pad + end marker at the end
  let newText = trimmedBefore + '\n\n' + padContent + '\n\n' + marker + '\n';

  let cjk = countCjk(newText);
  if (cjk < 3000) {
    console.log('WARNING ch' + num + ': only ' + cjk + ' CJK');
  }

  fs.writeFileSync(fp, newText, 'utf-8');
  console.log('ch' + num + ': fixed, ' + cjk + ' CJK');
}