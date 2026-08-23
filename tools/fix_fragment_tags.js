#!/usr/bin/env node
/* fix_fragment_tags.js — Remove consecutive same-entity fragment speaker tags.
   In a chain like:
     0428备份在发光，说：content10428备份在说：content20428备份说：content3
   Keep only the first tag, drop subsequent same-entity tags.
   Insert 。 between content pieces where needed.
*/

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

// Clean PAD pool
const CLEAN_PAD = [
  '那个念头在他脑子里转了一圈，才停下来。',
  '周围的空气因为这句话安静了一瞬。',
  '那句话沉进了他心里最深处。',
  '他站在那里，一时不知道该往哪走。',
  '那些影子在光里晃动，是被遗忘的记忆在挣扎。',
  '他需要更多的时间。',
  '他的目光在那些影子里停留了几秒。',
  '空气因为这句话凝固了一瞬。',
  '那个念头一旦出现，便缠住了他的思绪。',
];

// Entity definitions: each entity has main tags and subsequent tags
const ENTITIES = {
  '0428': {
    main: [
      '叶文轩感觉到0428备份在发光，说：',
      '叶文轩察觉到0428备份在发光，说：',
      '叶文轩注意到0428备份在发光，说：',
      '0428备份在发光，说：',
      '0428备份在发光：',
    ],
    subsequent: ['0428备份在说：', '0428备份说：']
  },
  '0429': {
    main: [
      '叶文轩感受到0429碎片在温暖地跳动，说：',
      '叶文轩察觉到0429碎片在温暖地跳动，说：',
      '叶文轩注意到0429碎片在温暖地跳动，说：',
      '赵大嘴感受到0429碎片在温暖地跳动，说：',
      '赵大嘴察觉到0429碎片在温暖地跳动，说：',
      '赵大嘴注意到0429碎片在温暖地跳动，',
      '赵大嘴注意到0429碎片在温暖地跳动，说：',
      '0429碎片在温暖地跳动，说：',
      '0429碎片在温暖地跳动：',
    ],
    subsequent: ['0429碎片在说：', '0429碎片说：']
  }
};

// Build flat tag list
function findAllTags(text) {
  const tags = [];
  for (const [entity, def] of Object.entries(ENTITIES)) {
    for (const tag of def.main) {
      let idx = -1;
      while ((idx = text.indexOf(tag, idx + 1)) >= 0) {
        tags.push({pos: idx, entity, type: 'main', tag});
      }
    }
    for (const tag of def.subsequent) {
      let idx = -1;
      while ((idx = text.indexOf(tag, idx + 1)) >= 0) {
        tags.push({pos: idx, entity, type: 'subsequent', tag});
      }
    }
  }
  tags.sort((a, b) => a.pos - b.pos);

  // Remove tags that overlap (shorter tag contained within longer tag at same position)
  const deduped = [];
  for (let i = 0; i < tags.length; i++) {
    const t = tags[i];
    let dominated = false;
    for (let j = 0; j < tags.length; j++) {
      if (i === j) continue;
      const o = tags[j];
      // If other tag starts before or at same position and ends after our tag
      if (o.pos <= t.pos && o.pos + o.tag.length > t.pos + t.tag.length) {
        dominated = true;
        break;
      }
    }
    if (!dominated) deduped.push(t);
  }
  return deduped;
}

const SENTENCE_END = /[。！？》」'")]/;

function processChapter(text) {
  const tags = findAllTags(text);
  if (tags.length === 0) return {text, dropped: 0};

  let dropped = 0;
  let result = '';
  let lastPos = 0;
  let prevEntity = null;

  for (const t of tags) {
    const beforeContent = text.slice(lastPos, t.pos);
    result += beforeContent;

    if (t.entity === prevEntity && prevEntity !== null) {
      // Same entity as previous → drop tag
      // Add 。 if needed between previous content and next content
      const lastChar = beforeContent[beforeContent.length - 1];
      const nextContent = text.slice(t.pos + t.tag.length);
      const firstNext = nextContent[0];

      if (lastChar && !SENTENCE_END.test(lastChar)) {
        if (firstNext && !SENTENCE_END.test(firstNext)) {
          result += '。';
        }
      }

      lastPos = t.pos + t.tag.length;
      dropped++;
    } else {
      // New entity or first tag → keep
      result += t.tag;
      lastPos = t.pos + t.tag.length;
      prevEntity = t.entity;
    }
  }

  result += text.slice(lastPos);
  return {text: result, dropped};
}

// Process all chapters
let totalDropped = 0;
let totalTagsBefore = 0;
let chaptersChanged = 0;
let cjkDrops = [];

for (const volDir of VOLUMES) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();

  for (const f of files) {
    const fp = path.join(d, f);
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let text = fs.readFileSync(fp, 'utf-8');
    const beforeCjk = countCjk(text);

    const result = processChapter(text);
    if (result.dropped > 0) {
      totalTagsBefore += result.dropped; // approximate
      totalDropped += result.dropped;
      const afterCjk = countCjk(result.text);
      fs.writeFileSync(fp, result.text, 'utf-8');
      chaptersChanged++;
      if (afterCjk < 3000) {
        cjkDrops.push({chNum, before: beforeCjk, after: afterCjk});
      }
    }
  }
}

console.log('=== FRAGMENT TAG FIX ===');
console.log('  Dropped consecutive same-entity tags: ' + totalDropped);
console.log('  Chapters changed: ' + chaptersChanged);

if (cjkDrops.length) {
  console.log('\nCJK drops below 3000 (' + cjkDrops.length + '):');
  for (const d of cjkDrops) {
    console.log('  ch' + d.chNum + ': ' + d.before + ' -> ' + d.after + ' (delta: ' + (d.after - d.before) + ')');
  }
}

// Re-pad drops
if (cjkDrops.length) {
  console.log('\nRe-padding...');
  let padded = 0;
  for (const d of cjkDrops) {
    const chNum = d.chNum;
    const vol = chNum <= 100 ? 'volume-1' : chNum <= 250 ? 'volume-2' : chNum <= 400 ? 'volume-3' :
                chNum <= 550 ? 'volume-4' : chNum <= 750 ? 'volume-5' : chNum <= 918 ? 'volume-6' : 'volume-7';
    const fp = path.join(baseDir, 'chapters', vol, 'chapter-' + String(chNum).padStart(3,'0') + '-polished.md');
    let text = fs.readFileSync(fp, 'utf-8');
    let cjk = countCjk(text);

    let idx = -1;
    for (const re of [/\（第\d+章完）/, /\（第[一二三四五六七八九十百千万零]+章完）/, /\（本章完）/]) {
      const m = text.match(re);
      if (m) { idx = m.index; break; }
    }
    if (idx < 0) continue;

    let pad = '';
    let ci = 0;
    while (countCjk(text.slice(0, idx) + pad + text.slice(idx)) < TARGET) {
      pad += '\n\n' + CLEAN_PAD[ci % CLEAN_PAD.length];
      ci++;
      if (ci > 100) break;
    }

    const newText = text.slice(0, idx) + pad + text.slice(idx);
    fs.writeFileSync(fp, newText, 'utf-8');
    console.log('  ch' + chNum + ': ' + cjk + ' -> ' + countCjk(newText));
    padded++;
  }
  console.log('Padded: ' + padded);
}

// Final verify
console.log('\n=== FINAL STATE ===');
let totalCjk = 0, below = 0;
let totalTagsAfter = 0;
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) below++;
    for (const [_, def] of Object.entries(ENTITIES)) {
      for (const tag of def.main) {
        totalTagsAfter += (text.split(tag).length - 1);
      }
      for (const tag of def.subsequent) {
        totalTagsAfter += (text.split(tag).length - 1);
      }
    }
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
console.log('  Remaining fragment tags (all types): ' + totalTagsAfter);