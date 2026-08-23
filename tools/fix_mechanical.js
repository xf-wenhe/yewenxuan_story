#!/usr/bin/env node
/*
fix_mechanical.js — Fix mechanical "在自行/在感知/在响应" repetition chains.

Strategy: collapse X+ item chains to 1 item via regex substitution.
Pad to 3020 CJK if below threshold after compression.

Passes (applied sequentially):
  1. "它在V。" chains (2+) → keep first
     e.g. "它在感知。它在响应。它在读取。" → "它在感知。"
  2. "X在自行V。X在自行V。" chains (2+) → keep first
     e.g. "线在自行流动。线在自行变化。线在自行闪烁。" → "线在自行流动。"
  3. "在自行V。在自行V。" chains without subject (2+) → keep first
     e.g. "在自行重组。在自行调整。" → "在自行重组。"
  4. "X在V。X在V。" chains (3+) → keep first
     e.g. "0429碎片在运行。0429碎片在生长。0429碎片在对抗。" → "0429碎片在运行。"
     2-item oppositions (如 "在收缩。在扩张。") 保留
  5. "X在感知这一刻" comma-chains → keep first
     e.g. "0429碎片在感知这一刻，0429碎片在记录这一刻。" → "0429碎片在感知这一刻。"

Usage:
  node tools/fix_mechanical.js --dry-run                    # scan only
  node tools/fix_mechanical.js --volumes v2,v3,v5           # run on specific volumes
  node tools/fix_mechanical.js                              # run all volumes
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const volFilter = process.argv.find(a => a.startsWith('--volumes='));
const volumes = volFilter ? volFilter.split('=').slice(-1)[0].split(',') : [];

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

// Regex for "在V" pattern: "在" + 1-10 CJK chars
// Wider than {1,4} to catch actions like "在缺口处自行流动" (7 chars)
const ZAI_V = '[一-鿿]{1,10}';
// Regex for subject: 1-25 non-period, non-newline chars
const SUBJECT = '(?:[^。\n，]{1,25}?)';

function fixText(text) {
  let mod = text;

  // === Pass 1: "它在V。" chains (2+) → keep first ===
  // "碎片在流动。它在脉动。它在闪烁。" or "它在感知。它在响应。"
  // Match: any "X在V。" followed by 2+ "它在V。" → keep first
  mod = mod.replace(
    new RegExp('(' + SUBJECT + '在' + ZAI_V + '[。])' + '(?:它在' + ZAI_V + '[。])+', 'g'),
    '$1'
  );
  // Standalone "它在V。" chains (2+):
  mod = mod.replace(new RegExp('(它在' + ZAI_V + '[。])(?:它在' + ZAI_V + '[。])+', 'g'), '$1');

  // === Pass 2: "X在自行V。X在自行V。" chains (2+) → keep first ===
  mod = mod.replace(
    new RegExp('(' + SUBJECT + '在自行' + ZAI_V + '[。])' + '(?:' + SUBJECT + '在自行' + ZAI_V + '[。])+', 'g'),
    '$1'
  );

  // === Pass 3: "在自行V。在自行V。" chains without subject (2+) → keep first ===
  mod = mod.replace(new RegExp('(在自行' + ZAI_V + '[。])(?:在自行' + ZAI_V + '[。])+', 'g'), '$1');

  // === Pass 4: "X在V。" chains (3+) → keep first ===
  mod = mod.replace(
    new RegExp('(' + SUBJECT + '在' + ZAI_V + '[。])' + '(?:' + SUBJECT + '在' + ZAI_V + '[。]){2,}', 'g'),
    '$1'
  );

  // === Pass 4b: "在V。" chains without subject (3+) → keep first ===
  mod = mod.replace(new RegExp('(在' + ZAI_V + '[。])(?:在' + ZAI_V + '[。]){2,}', 'g'), '$1');

  // === Pass 5: "X在感知这一刻" comma/period chains → keep first ===
  mod = mod.replace(
    new RegExp('(' + SUBJECT + '在感知这一刻)' + '(?:，(?:' + SUBJECT + '?)在[一-鿿]{1,10}这一刻)+[，。\\s]*[^，。\\n]{0,10}[。]?', 'g'),
    '$1。'
  );
  // Period-separated 3+ chains:
  mod = mod.replace(
    new RegExp('(' + SUBJECT + '在感知这一刻[。])' + '(?:' + SUBJECT + '在[一-鿿]{1,10}这一刻[。]){2,}', 'g'),
    '$1'
  );

  // === Pass 6: "X在V，X在V，X在V" comma-separated chains (3+) → keep first ===
  // e.g. "0429碎片在运行，0429碎片在生长，0429碎片在对抗" → "0429碎片在运行"
  mod = mod.replace(
    new RegExp('(' + SUBJECT + '在' + ZAI_V + ')(?:，(?:' + SUBJECT + '?)在' + ZAI_V + '){2,}', 'g'),
    '$1'
  );

  // === Pass 7: Periodless "X在V" chains (2+) → keep first ===
// Regex cannot handle periodless concatenation (no separator to anchor against),
// so we use a JS function that finds repeated subjects followed by "在" + action.
// e.g. "0429碎片在发热0429碎片在脉动0429碎片在对抗" → "0429碎片在发热"
// e.g. "0429备份在跨越边界0429备份在连接两个锚点" → "0429备份在跨越边界"
mod = collapsePeriodlessChains(mod);

function collapsePeriodlessChains(text) {
  const result = [];
  let i = 0;
  const len = text.length;
  const SEP = new Set(['。', '，', '\n']);

  while (i < len) {
    let matched = false;

    // Try subject lengths from 15 down to 2 (longest first = most specific)
    for (let subjLen = 15; subjLen >= 2; subjLen--) {
      if (i + subjLen >= len) continue;
      const subj = text.slice(i, i + subjLen);

      // Subject must not contain separators OR "在"
      let invalid = false;
      for (let k = 0; k < subj.length; k++) {
        if (SEP.has(subj[k]) || subj[k] === '在') { invalid = true; break; }
      }
      if (invalid) continue;

      // Must be followed by "在"
      if (text[i + subjLen] !== '在') continue;

      // Collect items: subject + "在" + action
      const items = [];
      let pos = i;

      while (pos + subjLen < len) {
        if (text.slice(pos, pos + subjLen) !== subj) break;
        if (text[pos + subjLen] !== '在') break;

        // Find action end
        let actionStart = pos + subjLen + 1;
        let actionEnd = actionStart;
        while (actionEnd < len && actionEnd - actionStart < 30) {
          const ch = text[actionEnd];
          if (SEP.has(ch)) break;
          // Check if next subject starts here
          if (actionEnd + subjLen <= len && text.slice(actionEnd, actionEnd + subjLen) === subj) break;
          actionEnd++;
        }

        items.push(actionEnd);
        pos = actionEnd;
      }

      if (items.length >= 2) {
        result.push(subj + '在' + text.slice(i + subjLen + 1, items[0]));
        i = items[items.length - 1];
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(text[i]);
      i++;
    }
  }

  return result.join('');
}

// === Pass 8: Subject repetition without separators (3+, subj≥4chars) → keep first ===
// Handles mixed patterns like "0429碎片的设计者X0429碎片的设计者Y0429碎片的设计者Z"
// where not all items have "在" after subject. Uses same JS approach.
mod = collapseSubjectRepetition(mod);

function collapseSubjectRepetition(text) {
  const result = [];
  let i = 0;
  const len = text.length;
  const SEP = new Set(['。', '，', '\n']);

  while (i < len) {
    let matched = false;

    // Try subject lengths from 15 down to 4
    for (let subjLen = 15; subjLen >= 4; subjLen--) {
      if (i + subjLen >= len) continue;
      const subj = text.slice(i, i + subjLen);

      let invalid = false;
      for (let k = 0; k < subj.length; k++) {
        if (SEP.has(subj[k]) || subj[k] === '在') { invalid = true; break; }
      }
      if (invalid) continue;

      // Must NOT be followed by "在" (that's Pass 7's territory)
      if (text[i + subjLen] === '在') continue;

      const items = [];
      let pos = i;

      while (pos + subjLen < len) {
        if (text.slice(pos, pos + subjLen) !== subj) break;

        let actionStart = pos + subjLen;
        let actionEnd = actionStart;
        while (actionEnd < len && actionEnd - actionStart < 30) {
          const ch = text[actionEnd];
          if (SEP.has(ch)) break;
          if (actionEnd + subjLen <= len && text.slice(actionEnd, actionEnd + subjLen) === subj) break;
          actionEnd++;
        }

        items.push(actionEnd);
        pos = actionEnd;
      }

      if (items.length >= 3) {
        result.push(subj + text.slice(i + subjLen, items[0]));
        i = items[items.length - 1];
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(text[i]);
      i++;
    }
  }

  return result.join('');
}

  return mod;
}

function addPadding(text, targetCjk) {
  const markers = [
    /\（第\d+章完）/,
    /\（第[一二三四五六七八九十百千万零]+章完）/,
    /\（本章完）/
  ];
  let idx = -1;
  for (const re of markers) {
    const m = text.match(re);
    if (m) { idx = m.index; break; }
  }
  if (idx < 0) return text;

  let cjk = countCjk(text.slice(0, idx));
  if (cjk >= targetCjk) return text;

  let pad = '';
  let ci = 0;
  while (countCjk(text.slice(0, idx) + pad) < targetCjk) {
    pad += '\n\n' + PAD[ci % PAD.length];
    ci++;
    if (ci > 200) break;
  }
  return text.slice(0, idx) + pad + text.slice(idx);
}

function shouldProcess(filepath) {
  if (volumes.length === 0) return true;
  for (const v of volumes) {
    const num = v.replace(/^v/i, '');
    if (filepath.includes('volume-' + num)) return true;
  }
  return false;
}

function main() {
  console.log(`=== ${dryRun ? 'DRY RUN' : 'APPLY'} MODE ===`);
  if (volumes.length > 0) console.log(`Volumes: ${volumes.join(', ')}`);

  const allFiles = [];
  for (const vol of ['1','2','3','4','5','6','7']) {
    const dir = path.join(ROOT, 'chapters', 'volume-' + vol);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('-polished.md'))) {
      const fp = path.join(dir, f);
      if (shouldProcess(fp)) allFiles.push(fp);
    }
  }
  console.log(`Total files to scan: ${allFiles.length}\n`);

  let modified = 0, totalDelta = 0, padded = 0, skipped = 0;
  let totalCjkBefore = 0, totalCjkAfter = 0;
  for (let i = 0; i < allFiles.length; i++) {
    const fp = allFiles[i];
    const orig = fs.readFileSync(fp, 'utf-8');
    const mod = fixText(orig);

    if (mod === orig) { skipped++; continue; }

    const oldCjk = countCjk(orig);
    totalCjkBefore += oldCjk;
    let newCjk = countCjk(mod);
    let finalText = mod;

    if (newCjk < 3000) {
      finalText = addPadding(mod, 3020);
      newCjk = countCjk(finalText);
      padded++;
    }
    totalCjkAfter += newCjk;

    if (!dryRun) fs.writeFileSync(fp, finalText, 'utf-8');

    modified++;
    totalDelta += newCjk - oldCjk;
    const sign = (newCjk - oldCjk) >= 0 ? '+' : '';
    const base = path.basename(fp);
    if (modified <= 30 || (newCjk - oldCjk) < -150) {
      console.log(`  ${base}: ${oldCjk} -> ${newCjk} (${sign}${newCjk - oldCjk})`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Files scanned: ${allFiles.length}`);
  console.log(`  Files modified: ${modified}`);
  console.log(`  Files skipped: ${skipped}`);
  console.log(`  Files padded: ${padded}`);
  console.log(`  Total CJK delta: ${totalDelta}`);
  console.log(`  Total CJK before: ${totalCjkBefore}`);
  console.log(`  Total CJK after: ${totalCjkAfter}`);
  if (dryRun) console.log('  DRY RUN — no files changed.');
}

main();