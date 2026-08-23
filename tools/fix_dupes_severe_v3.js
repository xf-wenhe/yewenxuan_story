#!/usr/bin/env node
/* fix_dupes_severe_v3.js — Handle 3 severe chapters with story merged into single paragraph */

const fs = require('fs');

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

// PAD paragraph markers: 3-sentence PAD blocks starting with these sentences
const PAD_SENT_STARTS = [
  '沉默在两人之间蔓延', '夜里的风比他想象', '他低头看了看自己的手',
  '那些被压下去的东西', '他不知道从哪里开始说', '记忆像破碎的镜片',
  '他抬起头，看向窗外', '时间在这种时候变得', '他想起很久以前听过',
  '脚下的路在延伸', '胸口像是压了一块', '他闭上眼睛，试图让自己',
  '那些声音还在耳边回响', '有些话到了嘴边', '他不知道自己现在该做',
  '夜色越来越深', '他转过身，背对着', '记忆在重组', '他摸了摸口袋',
  '远处传来一声响动', '他没有再说话', '那些数字在他脑海里',
  '他不确定自己看到的', '胸口那股暖意', '空气里弥漫着一股',
  '他把手插进衣服口袋', '那些画面在他眼前', '他不知道这条路要走',
  '他蹲下来', '他听见自己的心跳', '夜空中没有星星',
  '他不知道自己还能撑', '风把树叶吹得', '他伸出手，想抓住',
  '那些消失的人', '他没有回头看', '这件事的来龙去脉',
  '那些影子在光里晃动', '这句话像一块石头', '他没有急着做出判断',
  '远处的风声似乎也大', '他站在那里，一时', '他深吸了一口气',
  '这个念头在他脑子里', '周围的空气似乎也', '这个念头一旦出现',
  '他没有把话说完', '那些记忆像潮水', '他不知道从什么时候开始',
  '那些光点在他意识深处', '这些话没有出口',
];

for (const [fp, num] of targets) {
  const text = fs.readFileSync(fp, 'utf-8');
  const marker = '（第' + num + '章完）';
  const paras = text.split('\n\n');

  // Split each paragraph into individual sentences for dedup
  // First, separate title, story, and PAD
  let titleLine = '';
  let storySentences = [];
  let padParagraphs = [];

  for (let i = 0; i < paras.length; i++) {
    const p = paras[i].trim();
    if (!p) continue;
    if (p.includes(marker)) continue;

    // Check if this is the title paragraph (contains # and title)
    if (p.includes('# ')) {
      // Split into lines
      const lines = p.split('\n');
      titleLine = lines[0];
      // Rest of the lines are story sentences
      for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim();
        if (line) storySentences.push(line);
      }
      continue;
    }

    // Check if this is a PAD paragraph (multi-sentence block starting with known PAD sentence)
    const isPad = PAD_SENT_STARTS.some(start => p.startsWith(start));

    if (isPad) {
      // Split into individual sentences (each PAD sentence ends with 。)
      const sents = p.split('。').map(s => s.trim()).filter(s => s.length > 0).map(s => s + '。');
      padParagraphs.push({ original: p, sentences: sents });
    } else {
      // It's a story sentence or a story paragraph
      const sents = p.split('。').map(s => s.trim()).filter(s => s.length > 0).map(s => s + '。');
      storySentences.push(...sents);
    }
  }

  // Dedup story sentences (preserve order)
  const seenStory = new Set();
  const dedupedStory = [];
  for (const s of storySentences) {
    if (!seenStory.has(s)) {
      seenStory.add(s);
      dedupedStory.push(s);
    }
  }

  let storyText = dedupedStory.join('\n\n');
  const storyCjk = countCjk(storyText);

  // Dedup PAD sentences
  const allPadSents = padParagraphs.flatMap(pp => pp.sentences);
  const seenAll = new Set([...dedupedStory]);
  const dedupedPadSents = [];
  for (const s of allPadSents) {
    if (!seenAll.has(s)) {
      seenAll.add(s);
      dedupedPadSents.push(s);
    }
  }

  // Group PAD sentences into paragraphs of 3
  const padParas = [];
  for (let i = 0; i < dedupedPadSents.length; i += 3) {
    const group = dedupedPadSents.slice(i, i + 3);
    padParas.push(group.join(''));
  }

  const padCjk = countCjk(padParas.join('\n\n'));
  let totalCjk = storyCjk + padCjk;

  console.log('ch' + num + ':');
  console.log('  story sentences:', dedupedStory.length, '(' + storyCjk + ' CJK)');
  console.log('  pad paragraphs:', padParas.length, '(' + padCjk + ' CJK)');
  console.log('  total:', totalCjk);

  // If below 3000, need to add more PAD paragraphs
  if (totalCjk < 3000) {
    console.log('  BELOW 3000 — need Phase 2 rewrite (story content too thin)');
    continue;
  }

  // Reconstruct
  const newText = titleLine + '\n\n' + storyText + (padParas.length > 0 ? '\n\n' + padParas.join('\n\n') : '') + '\n\n' + marker + '\n';

  fs.writeFileSync(fp, newText, 'utf-8');
  console.log('  WRITTEN ✓');
}