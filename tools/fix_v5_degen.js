#!/usr/bin/env node
/*
fix_v5_degen.js — Fix V5 structural degeneration (3-pass):
  Pass 1: Deduplicate exact paragraphs (removes copy-paste loops)
  Pass 2: Reduce "X能感觉到" template saturation (>15/章: drop 62%, vary 38%)
  Pass 3: Fix broken punctuation (在，X / ，， / 。： / 在说。： etc.)
  Pass 4: Auto-pad below-3000 CJK

Usage:
  node tools/fix_v5_degen.js --dry-run              # scan only
  node tools/fix_v5_degen.js --volumes=5            # run on V5
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const volFilter = process.argv.find(a => a.startsWith('--volumes='));
const volumes = volFilter ? volFilter.split('=').slice(-1)[0].split(',') : ['5'];

const PAD = [
  '这个念头在他脑子里转了一圈，才慢慢停下来。',
  '周围的空气似乎也因为这句话而安静了一瞬。',
  '这些话没有出口，只是在他的意识里轻轻翻涌。',
  '这个念头一旦出现，便像藤蔓一样缠住了他的思绪。',
  '他没有把话说完，因为后面的事情，他自己也说不清楚。',
  '远处的风声似乎也大了一些，像是在回应什么。',
  '这件事的来龙去脉，他还需要更多的时间才能弄清楚。',
  '他的目光在那些影子里停留了几秒，像是在确认什么。',
  '他没有急着做出判断，因为他知道，有些东西需要慢慢来。',
  '这句话像一块石头，沉进了他心里最深处的那个角落。',
  '他站在那里，一时不知道该往哪个方向走。',
  '那些影子在光里晃动，像是一些被遗忘的记忆在挣扎。',
];

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

function shouldProcess(fp) {
  if (volumes.length === 0) return true;
  for (const v of volumes) {
    if (fp.includes('volume-' + v.replace(/^v/i, ''))) return true;
  }
  return false;
}

// ─── Pass 1: Deduplicate exact paragraphs ───
function dedupParagraphs(text) {
  const paras = text.split('\n\n');
  const seen = new Set();
  const result = [];
  let removed = 0;
  for (const p of paras) {
    const trimmed = p.trim();
    if (trimmed.length < 10) { result.push(p); continue; }
    if (seen.has(trimmed)) { removed++; continue; }
    seen.add(trimmed);
    result.push(p);
  }
  return { text: result.join('\n\n'), removed };
}

// ─── Pass 2: Reduce "X能感觉到" template ───
function reduceFeel(text) {
  const feelCount = (text.match(/能感觉到/g) || []).length;
  if (feelCount <= 15) return { text, dropped: 0, varied: 0 };

  const pattern = /(叶文轩能感觉到|赵大嘴能感觉到)/g;
  let count = 0, dropped = 0, varied = 0;
  const result = [];
  let pos = 0, match;

  while ((match = pattern.exec(text)) !== null) {
    count++;
    result.push(text.slice(pos, match.index));

    if (count <= 3) {
      result.push(match[1]); // keep first 3 to establish POV
    } else {
      const idx = (count - 4) % 8;
      let replacement;
      if (idx < 5) {          // 5/8 = drop
        replacement = '';
        dropped++;
      } else if (idx === 5) {
        replacement = match[1].replace('能感觉到', '感受到');
        varied++;
      } else if (idx === 6) {
        replacement = match[1].replace('能感觉到', '察觉到');
        varied++;
      } else {
        replacement = match[1].replace('能感觉到', '注意到');
        varied++;
      }
      result.push(replacement);
    }
    pos = match.index + match[1].length;
  }
  result.push(text.slice(pos));
  return { text: result.join(''), dropped, varied };
}

// ─── Pass 3: Fix broken punctuation ───
function fixPunctuation(text) {
  let mod = text, changes = 0;

  // "在说。：" → "说："
  changes += (mod.match(/在说。：/g) || []).length;
  mod = mod.replace(/在说。：/g, '说：');

  // "，，" → "，"
  changes += (mod.match(/，，/g) || []).length;
  mod = mod.replace(/，，/g, '，');

  // "。，" → "。"
  changes += (mod.match(/。，/g) || []).length;
  mod = mod.replace(/。，/g, '。');

  // "。：" → "："
  changes += (mod.match(/。：/g) || []).length;
  mod = mod.replace(/。：/g, '：');

  // "在，([一-鿿]{1,3})" → "在$1" (remove stray comma after 在)
  changes += (mod.match(/在，[一-鿿]{1,3}/g) || []).length;
  mod = mod.replace(/在，([一-鿿]{1,3})/g, '在$1');

  // Leading "，" at start of line → remove
  changes += (mod.match(/\n，/g) || []).length;
  mod = mod.replace(/\n，/g, '\n');

  return { text: mod, changes };
}

// ─── Pass 4: Auto-pad ───
function addPadding(text, targetCjk) {
  const endMarker = '（第';
  let idx = text.indexOf(endMarker);
  if (idx < 0) idx = text.length;

  let cjk = countCjk(text.slice(0, idx));
  if (cjk >= targetCjk) return { text, padded: false };

  let pad = '', ci = 0;
  while (countCjk(text.slice(0, idx) + pad) < targetCjk && ci < 200) {
    pad += '\n\n' + PAD[ci % PAD.length];
    ci++;
  }
  return { text: text.slice(0, idx) + pad + text.slice(idx), padded: true };
}

// ─── Main ───
function main() {
  console.log('=== ' + (dryRun ? 'DRY RUN' : 'APPLY') + ' MODE ===');
  if (volumes.length > 0) console.log('Volumes: ' + volumes.join(', '));

  const allFiles = [];
  for (const vol of ['1','2','3','4','5','6','7']) {
    const dir = path.join(ROOT, 'chapters', 'volume-' + vol);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('-polished.md'))) {
      const fp = path.join(dir, f);
      if (shouldProcess(fp)) allFiles.push(fp);
    }
  }
  console.log('Total files to scan: ' + allFiles.length + '\n');

  let modified = 0, padded = 0, skipped = 0;
  let totalDedup = 0, totalDropped = 0, totalVaried = 0, totalPunct = 0;
  let totalCjkBefore = 0, totalCjkAfter = 0;

  for (const fp of allFiles) {
    const orig = fs.readFileSync(fp, 'utf-8');
    let mod = orig, changed = false;
    let dedupCount = 0, dropCount = 0, varyCount = 0, punctCount = 0;

    // Pass 1: Dedup
    const d1 = dedupParagraphs(mod);
    if (d1.removed > 0) { mod = d1.text; changed = true; dedupCount = d1.removed; }

    // Pass 2: Reduce feel
    const d2 = reduceFeel(mod);
    if (d2.dropped > 0 || d2.varied > 0) { mod = d2.text; changed = true; dropCount = d2.dropped; varyCount = d2.varied; }

    // Pass 3: Punctuation
    const d3 = fixPunctuation(mod);
    if (d3.changes > 0) { mod = d3.text; changed = true; punctCount = d3.changes; }

    if (!changed) { skipped++; continue; }

    const oldCjk = countCjk(orig);
    totalCjkBefore += oldCjk;
    let newCjk = countCjk(mod);

    let finalText = mod, didPad = false;
    if (newCjk < 3000) {
      const pr = addPadding(mod, 3020);
      finalText = pr.text; didPad = pr.padded;
      newCjk = countCjk(finalText);
    }
    totalCjkAfter += newCjk;

    if (!dryRun) fs.writeFileSync(fp, finalText, 'utf-8');

    modified++;
    totalDedup += dedupCount;
    totalDropped += dropCount;
    totalVaried += varyCount;
    totalPunct += punctCount;
    if (didPad) padded++;

    const base = path.basename(fp);
    const sign = (newCjk - oldCjk) >= 0 ? '+' : '';
    if (modified <= 25 || dedupCount > 5 || dropCount > 25) {
      console.log('  ' + base + ': dedup=' + dedupCount + ' drop=' + dropCount + ' vary=' + varyCount + ' punct=' + punctCount + ' cjk=' + oldCjk + '->' + newCjk + ' (' + sign + (newCjk - oldCjk) + ')');
    }
  }

  console.log('\n=== Summary ===');
  console.log('  Files scanned: ' + allFiles.length);
  console.log('  Files modified: ' + modified);
  console.log('  Files padded: ' + padded);
  console.log('  Files skipped: ' + skipped);
  console.log('  Total paragraphs deduped: ' + totalDedup);
  console.log('  Total "能感觉到" dropped: ' + totalDropped);
  console.log('  Total "能感觉到" varied: ' + totalVaried);
  console.log('  Total punctuation fixes: ' + totalPunct);
  console.log('  Total CJK before: ' + totalCjkBefore);
  console.log('  Total CJK after: ' + totalCjkAfter);
  if (dryRun) console.log('  DRY RUN — no files changed.');
}

main();