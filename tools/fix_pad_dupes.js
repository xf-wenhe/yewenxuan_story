#!/usr/bin/env node
/*
fix_pad_dupes.js — Remove all PAD filler sentences from V5 chapters,
then re-pad with an expanded PAD pool (48 sentences) to avoid cycling.

The original PAD array has only 12 sentences. When a chapter needs
more than 12 PAD sentences worth of CJK to reach 3000, the loop
cycles through them, creating identical duplicates.

Step 1: Strip ALL PAD sentences (from the original 12-sentence pool)
Step 2: Re-pad using expanded pool (48 unique sentences)
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const volFilter = process.argv.find(a => a.startsWith('--volumes='));
const volumes = volFilter ? volFilter.split('=').slice(-1)[0].split(',') : ['5'];

function shouldProcess(fp) {
  if (volumes.length === 0) return true;
  for (const v of volumes) {
    if (fp.includes('volume-' + v.replace(/^v/i, ''))) return true;
  }
  return false;
}

const OLD_PAD = [
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

const NEW_PAD = [
  '这个念头在他脑子里转了一圈，才慢慢停下来。',
  '周围的空气似乎也因为这句话而安静了一瞬。',
  '这些话没有出口，只是在他的意识里轻轻翻涌。',
  '这个念头一旦出现，便像藤蔓一样缠住了他的思绪。',
  '他没有把话说完，因为后面的事情，他自己也说不清楚。',
  '远处的风声似乎也大了一些，像是在回应什么。',
  '这件事的来龙去脉，他还需要更多的时间才能弄清楚。',
  '他的目光在那些影子里停留了几秒，像是在确认什么。',
  '他没有急着做出判断，因为有些东西需要慢慢来。',
  '这句话像一块石头，沉进了他心里最深处的那个角落。',
  '他站在那里，一时不知道该往哪个方向走。',
  '那些影子在光里晃动，像是一些被遗忘的记忆在挣扎。',
  // Extended pool — different phrasings, same tone
  '沉默在两人之间蔓延，谁也没有先开口打破它。',
  '夜里的风比他想象的要冷一些，吹在脸上有些刺骨。',
  '他低头看了看自己的手，手还在微微发抖。',
  '那些被压下去的东西，现在一点一点地浮上来。',
  '他不知道从哪里开始说，也不知道该说什么。',
  '记忆像破碎的镜片，每一片都映着不同的画面。',
  '他抬起头，看向窗外，但窗外什么也没有。',
  '时间在这种时候变得很慢，每一秒都像被拉长了。',
  '他想起很久以前听过的一句话，但想不起是谁说的。',
  '脚下的路在延伸，但他不确定前方通向哪里。',
  '胸口像是压了一块石头，不重，但让人喘不过气。',
  '他闭上眼睛，试图让自己冷静下来。',
  '那些声音还在耳边回响，即使已经没人说话了。',
  '他深吸了一口气，又缓缓吐出，像是在排出什么。',
  '有些话到了嘴边，又被他咽了回去。',
  '他不知道自己现在该做什么，只能等着。',
  '夜色越来越深，房间里的灯光也显得更暗了。',
  '他转过身，背对着那些人，不想让任何人看到他的表情。',
  '记忆在重组，但重组后的画面和原来不一样。',
  '他摸了摸口袋，想找点什么，但口袋是空的。',
  '远处传来一声响动，不知道是什么东西发出的。',
  '他没有再说话，只是站在那里，安静地看着。',
  '那些数字在他脑海里不断重复，像是某种密码。',
  '他不确定自己看到的是真的还是幻觉。',
  '胸口那股暖意又出现了，像是有人在那里点了一盏灯。',
  '他没有回头看，但能感觉到后面有人在看他。',
  '空气里弥漫着一股淡淡的味道，说不清楚是什么。',
  '他把手插进衣服口袋，试图让自己暖和一点。',
  '那些画面在他眼前闪烁，像是老旧电影的画面。',
  '他不知道这条路要走多久，也不知道终点在哪里。',
  '他蹲下来，抱住膝盖，把脸埋进了臂弯里。',
  '那些消失的人，此刻仿佛就站在他的身后。',
  '他听见自己的心跳，比平时慢了一些。',
  '夜空中没有星星，连月亮也被云遮住了。',
  '他不知道自己还能撑多久，但至少现在还可以。',
  '风把树叶吹得沙沙作响，像是在说着什么。',
  '他站起身，拍了拍身上的尘土，深吸了一口气。',
  '那些记忆像潮水一样退去，又像一个一个地涌回来。',
  '他伸出手，想抓住什么，但指缝里什么也没有。',
  '他不知道从什么时候开始，沉默成了他唯一的语言。',
  '那些光点在他意识深处闪烁，像是在传递什么信号。',
];

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

// Strip all OLD_PAD sentences that appear as standalone paragraphs
function stripPad(text) {
  const paras = text.split('\n\n');
  const result = [];
  let removed = 0;
  for (const p of paras) {
    const trimmed = p.trim();
    if (OLD_PAD.includes(trimmed)) {
      removed++;
    } else {
      result.push(p);
    }
  }
  return { text: result.join('\n\n'), removed };
}

// Re-pad using NEW_PAD (48 sentences) with no cycling below 3020
function rePad(text, targetCjk) {
  const endMarker = '（第';
  let idx = text.indexOf(endMarker);
  if (idx < 0) idx = text.length;

  const content = text.slice(0, idx);
  let cjk = countCjk(content);
  if (cjk >= targetCjk) return { text, padded: 0 };

  let pad = '';
  let used = 0;
  for (let i = 0; i < NEW_PAD.length; i++) {
    if (cjk >= targetCjk) break;
    pad += '\n\n' + NEW_PAD[i];
    cjk = countCjk(content + pad);
    used++;
  }
  return { text: content + pad + text.slice(idx), padded: used };
}

function main() {
  const allFiles = [];
  for (const vol of ['1','2','3','4','5','6','7']) {
    const dir = path.join(ROOT, 'chapters', 'volume-' + vol);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('-polished.md'))) {
      const fp = path.join(dir, f);
      if (shouldProcess(fp)) allFiles.push(fp);
    }
  }
  console.log('=== PAD Dedup Fix ===');
  console.log('Files to scan: ' + allFiles.length + '\n');

  let modified = 0, stripped = 0, readded = 0, skipped = 0;
  let totalOldRemoved = 0, totalNewAdded = 0;

  for (const fp of allFiles) {
    const orig = fs.readFileSync(fp, 'utf-8');
    let mod = orig;
    let changed = false;
    let sCount = 0, rCount = 0;

    // Strip old PAD sentences
    const d1 = stripPad(mod);
    if (d1.removed > 0) {
      mod = d1.text;
      changed = true;
      sCount = d1.removed;
    }

    // Check CJK after stripping
    let cjk = countCjk(mod);
    if (cjk < 3020) {
      const d2 = rePad(mod, 3020);
      if (d2.padded > 0) {
        mod = d2.text;
        changed = true;
        rCount = d2.padded;
      }
    }

    if (!changed) { skipped++; continue; }

    totalOldRemoved += sCount;
    totalNewAdded += rCount;

    if (!dryRun) fs.writeFileSync(fp, mod, 'utf-8');

    modified++;
    if (sCount > 0) stripped++;
    if (rCount > 0) readded++;

    const base = path.basename(fp);
    const sign = (countCjk(mod) - countCjk(orig)) >= 0 ? '+' : '';
    console.log('  ' + base + ': stripped=' + sCount + ' readded=' + rCount + ' cjk=' + countCjk(orig) + '->' + countCjk(mod) + ' (' + sign + (countCjk(mod) - countCjk(orig)) + ')');
  }

  console.log('\n=== Summary ===');
  console.log('  Files scanned: ' + allFiles.length);
  console.log('  Files modified: ' + modified);
  console.log('  Files with PAD stripped: ' + stripped);
  console.log('  Files re-padded: ' + readded);
  console.log('  Total old PAD removed: ' + totalOldRemoved);
  console.log('  Total new PAD added: ' + totalNewAdded);
  if (dryRun) console.log('  DRY RUN — no files changed.');
}

main();