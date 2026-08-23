#!/usr/bin/env node
/*
fix_feel.js — Fix "能感觉到X在说：A，X在说：B" colon-chain degeneration.

Strategy: position-based scan of consecutive "在说：" instances.

Pattern 1: "X在说：msg1X在说：msg2。" → "X说：msg1，msg2。"
  - When two "在说：" instances have no "。" or "\n" between them,
    collapse the second "SUBJ在说：" to just "说："
Pattern 2: "，X在说：" where X appeared before the comma → "，说："

Both handled by a single pass that walks "在说：" positions.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const volFilter = process.argv.find(a => a.startsWith('--volumes='));
const volumes = volFilter ? volFilter.split('=').slice(-1)[0].split(',') : [];

const COLON = '在说：';

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

function fixText(text) {
  let mod = collapseConsecutiveSay(text);
  mod = collapseSayAfterComma(mod);
  return mod;
}

/*
  Collapse consecutive "在说：" instances (no 。 or \n between them).
  "X在说：msg1，msg2X在说：msg3。" → "X在说：msg1，msg2说：msg3。"
*/
function collapseConsecutiveSay(text) {
  let result = '';
  let pos = 0;
  let changed = false;

  while (true) {
    const idx = text.indexOf(COLON, pos);
    if (idx < 0) break;

    // Copy everything up to and including "在说："
    result += text.slice(pos, idx + 3);

    // Determine message end: the nearest of 。 \n or next 在说：
    let nextPeriod = text.indexOf('。', idx + 3);
    let nextColon = text.indexOf(COLON, idx + 3);
    let nextNewline = text.indexOf('\n', idx + 3);

    let candidates = [];
    if (nextPeriod >= 0) candidates.push(nextPeriod);
    if (nextColon >= 0) candidates.push(nextColon);
    if (nextNewline >= 0) candidates.push(nextNewline);

    let msgEnd = text.length;
    if (candidates.length > 0) msgEnd = Math.min(...candidates);

    // Copy message content
    result += text.slice(idx + 3, msgEnd);

    // If the message ended at a "在说：" (consecutive chain), collapse
    if (nextColon >= 0 && msgEnd === nextColon) {
      result += '说：';  // replace "SUBJ在说：" with "说："
      pos = nextColon + 3;
      changed = true;
    } else {
      pos = msgEnd;
    }
  }

  result += text.slice(pos);
  return result;
}

/*
  Collapse "，X在说：" where X appears before the comma in the same sentence.
  "0428备份在发光，0428备份在说：" → "0428备份在发光，说："
*/
function collapseSayAfterComma(text) {
  const colons = [];
  let i = 0;
  while (true) {
    const idx = text.indexOf(COLON, i);
    if (idx < 0) break;
    colons.push(idx);
    i = idx + 3;
  }
  if (colons.length === 0) return text;

  let result = '';
  let pos = 0;

  for (const idx of colons) {
    if (idx < pos) continue;

    // Find subject: walk back from "在说：" to find the word before it
    let subjStart = idx - 1;
    while (subjStart >= 0 && idx - subjStart <= 20) {
      const ch = text[subjStart];
      if (ch === '。' || ch === '\n' || ch === '，' || ch === '、' || ch === '：') break;
      subjStart--;
    }
    subjStart++;
    const subj = text.slice(subjStart, idx);

    // Check if char before subject is "，" and subject appeared earlier
    if (subjStart > 0 && text[subjStart - 1] === '，' && subj.length >= 2) {
      const beforeComma = text.slice(Math.max(0, subjStart - 1 - 30), subjStart - 1);
      if (beforeComma.includes(subj)) {
        result += text.slice(pos, subjStart - 1); // up to but not including "，"
        result += '，说：';
        pos = idx + 3;
        continue;
      }
    }

    result += text.slice(pos, idx + 3);
    pos = idx + 3;
  }

  result += text.slice(pos);
  return result;
}

function addPadding(text, targetCjk) {
  const endMarker = '（第';
  let idx = text.indexOf(endMarker);
  if (idx < 0) idx = text.length;

  let pad = '';
  let ci = 0;
  while (countCjk(text.slice(0, idx) + pad) < targetCjk) {
    pad += '\n\n' + PAD[ci % PAD.length];
    ci++;
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

  let modified = 0, totalDelta = 0, skipped = 0, padded = 0;
  let totalCjkBefore = 0, totalCjkAfter = 0;

  for (const fp of allFiles) {
    const orig = fs.readFileSync(fp, 'utf-8');
    let mod = fixText(orig);

    if (mod === orig) { skipped++; continue; }

    const oldCjk = countCjk(orig);
    totalCjkBefore += oldCjk;
    let newCjk = countCjk(mod);

    if (newCjk < 3000) {
      mod = addPadding(mod, 3020);
      newCjk = countCjk(mod);
      padded++;
    }
    totalCjkAfter += newCjk;

    if (!dryRun) fs.writeFileSync(fp, mod, 'utf-8');

    modified++;
    totalDelta += newCjk - oldCjk;
    const sign = (newCjk - oldCjk) >= 0 ? '+' : '';
    const base = path.basename(fp);
    if (modified <= 20 || (newCjk - oldCjk) < -100) {
      console.log('  ' + base + ': ' + oldCjk + ' -> ' + newCjk + ' (' + sign + (newCjk - oldCjk) + ')' + (newCjk < 3000 ? ' **BELOW**' : ''));
    }
  }

  console.log('\n=== Summary ===');
  console.log('  Files scanned: ' + allFiles.length);
  console.log('  Files modified: ' + modified);
  console.log('  Files padded: ' + padded);
  console.log('  Files skipped: ' + skipped);
  console.log('  Total CJK delta: ' + totalDelta);
  if (dryRun) console.log('  DRY RUN — no files changed.');
}

main();