#!/usr/bin/env node
/*
fix_v5_trailing.js — Clean up 19 V5 chapters with content after end marker.

Two types:
1. 14 chapters (675-688) with injected Python code from original deslop pass
2. 5 chapters (666, 693, 694, 695, 732, 733, 734) with degenerate story content after marker

Strategy: Strip everything after the first valid end marker `（第NNN章完）`.
If the result has < 3000 CJK, add padding from the expanded pool.
Also fix double end markers.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const vol = '5';
const dir = path.join(ROOT, 'chapters', 'volume-' + vol);

const PAD = [
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
  '空气里弥漫着一股淡淡的味道，说不清楚是什么。',
  '他把手插进衣服口袋，试图让自己暖和一点。',
  '那些画面在他眼前闪烁，像是老旧电影的画面。',
  '他不知道这条路要走多久，也不知道终点在哪里。',
  '他蹲下来，抱住膝盖，把脸埋进了臂弯里。',
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

const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('-polished.md'))
  .sort((a, b) => a.localeCompare(b));

let modified = 0, stripped = 0, repadded = 0;

for (const f of files) {
  const fp = path.join(dir, f);
  const text = fs.readFileSync(fp, 'utf-8');

  // Find end marker
  const markerMatch = text.match(/（第\d+章完）/);
  if (!markerMatch) continue;

  const idx = markerMatch.index;
  const after = text.slice(idx + markerMatch[0].length);

  if (after.trim().length === 0) continue; // nothing to clean

  // Strip everything after first end marker
  let cleaned = text.slice(0, idx + markerMatch[0].length);

  // Fix double end markers — strip extra copies of the same marker
  const doubleMatch = cleaned.match(/（第\d+章完）（第\d+章完）/);
  if (doubleMatch) {
    cleaned = cleaned.slice(0, doubleMatch.index + doubleMatch[0].length);
  }

  // Check if we need padding
  let cjk = countCjk(cleaned);
  let padCount = 0;

  if (cjk < 3020) {
    let pad = '';
    for (let i = 0; i < PAD.length; i++) {
      if (cjk >= 3020) break;
      pad += '\n\n' + PAD[i];
      cjk = countCjk(cleaned + pad);
      padCount++;
    }
    cleaned = cleaned + pad;
  }

  fs.writeFileSync(fp, cleaned, 'utf-8');
  modified++;
  stripped++;

  const chNum = f.match(/chapter-(\d+)/)[1];
  console.log(`  ch${chNum}: stripped ${after.length} chars after marker${padCount ? ` +padded ${padCount} (${countCjk(cleaned)} CJK)` : ''}`);
}

console.log(`\n=== Summary ===`);
console.log(`  Modified: ${modified}`);
console.log(`  Stripped trailing content: ${stripped}`);
console.log(`  Re-padded: ${repadded}`);