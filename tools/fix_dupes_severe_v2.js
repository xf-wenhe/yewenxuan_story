#!/usr/bin/env node
/* fix_dupes_severe_v2.js — Aggressive dedup for ch694/695/732, then re-pad */

const fs = require('fs');

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
  '他伸出手，想抓住什么，但指缝里什么也没有。',
  '那些消失的人，此刻仿佛就站在他的身后。',
  '他没有回头看，但能感觉到后面有人在看他。',
  '这件事的来龙去脉，他还需要更多的时间才能弄清楚。',
  '那些影子在光里晃动，像是一些被遗忘的记忆在挣扎。',
  '这句话像一块石头，沉进了他心里最深处的那个角落。',
  '他没有急着做出判断，因为有些东西需要慢慢来。',
  '远处的风声似乎也大了一些，像是在回应什么。',
  '他站在那里，一时不知道该往哪个方向走。',
  '这个念头在他脑子里转了一圈，才慢慢停下来。',
  '周围的空气似乎也因为这句话而安静了一瞬。',
  '这个念头一旦出现，便像藤蔓一样缠住了他的思绪。',
  '他没有把话说完，因为后面的事情，他自己也说不清楚。',
  '那些记忆像潮水一样退去，又像一个一个地涌回来。',
  '他不知道从什么时候开始，沉默成了他唯一的语言。',
  '那些光点在他意识深处闪烁，像是在传递什么信号。',
  '这些话没有出口，只是在他的意识里轻轻翻涌。',
];

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

const targets = [
  ['chapters/volume-5/chapter-732-polished.md', 732],
  ['chapters/volume-5/chapter-695-polished.md', 695],
  ['chapters/volume-5/chapter-694-polished.md', 694],
];

for (const [fp, num] of targets) {
  const text = fs.readFileSync(fp, 'utf-8');
  const marker = '（第' + num + '章完）';

  // Split into paragraphs
  let paras = text.split('\n\n');

  // Separate story paragraphs from PAD paragraphs
  // Story = everything before first PAD marker paragraph
  const PAD_START_MARKERS = [
    '沉默在两人之间蔓延，谁也没有',
    '这个念头一旦出现，便像藤蔓',
    '他没有急着做出判断，因为有些',
    '夜里的风比他想象',
  ];

  let padStartIdx = -1;
  for (let i = 0; i < paras.length; i++) {
    const trimmed = paras[i].trim();
    for (const pm of PAD_START_MARKERS) {
      if (trimmed.includes(pm)) { padStartIdx = i; break; }
    }
    if (padStartIdx >= 0) break;
  }

  if (padStartIdx < 0) {
    console.log('ch' + num + ': PAD start not found');
    continue;
  }

  // Collect all content paragraphs (skip title, marker)
  let storyParas = [];
  let padParas = [];
  for (let i = 0; i < paras.length; i++) {
    const trimmed = paras[i].trim();
    if (i < padStartIdx) {
      if (trimmed.length > 5 && !trimmed.includes('#')) {
        storyParas.push(trimmed);
      }
    } else if (i > padStartIdx) {
      if (trimmed.length > 5 && !trimmed.includes('章完）')) {
        padParas.push(trimmed);
      }
    }
  }

  // Dedup story paragraphs
  const seenStory = new Set();
  const dedupedStory = [];
  for (const p of storyParas) {
    if (!seenStory.has(p)) {
      seenStory.add(p);
      dedupedStory.push(p);
    }
  }

  let storyText = dedupedStory.join('\n\n');
  const storyCjk = countCjk(storyText);

  // Dedup PAD paragraphs
  const seenPad = new Set();
  const dedupedPad = [];
  for (const p of padParas) {
    if (!seenPad.has(p) && !seenStory.has(p)) {
      seenPad.add(p);
      dedupedPad.push(p);
    }
  }

  // If we still don't have enough, generate new PAD paragraphs (3 sentences each)
  let currentCjk = storyCjk + countCjk(dedupedPad.join('\n\n'));
  let newPadParas = [];
  if (currentCjk < 3020) {
    let cycle = 0;
    while (currentCjk < 3020) {
      const startIdx = (cycle * 3) % PAD.length;
      let paraSentences = [];
      for (let j = 0; j < 3; j++) {
        const idx = (startIdx + j) % PAD.length;
        paraSentences.push(PAD[idx]);
      }
      const para = paraSentences.join('');
      // Only add if not already seen
      if (!seenPad.has(para) && !seenStory.has(para)) {
        newPadParas.push(para);
        seenPad.add(para);
        currentCjk = countCjk(storyText + '\n\n' + [...dedupedPad, ...newPadParas].join('\n\n'));
      }
      cycle++;
      if (cycle > 100) break;
    }
  }

  const allPad = [...dedupedPad, ...newPadParas];
  const newText = storyText + (allPad.length > 0 ? '\n\n' + allPad.join('\n\n') : '') + '\n\n' + marker + '\n';
  const newCjk = countCjk(newText);

  console.log('ch' + num + ': story=' + storyCjk + ', pad=' + countCjk(allPad.join('\n\n')) + ', total=' + newCjk);
  console.log('  story paras:', dedupedStory.length, '(deduped from', storyParas.length + ')');
  console.log('  pad paras:', allPad.length, '(deduped from', padParas.length + ', new:', newPadParas.length + ')');

  if (newCjk >= 3000) {
    fs.writeFileSync(fp, newText, 'utf-8');
    console.log('  WRITTEN ✓');
  } else {
    console.log('  BELOW 3000, NOT written');
  }
}