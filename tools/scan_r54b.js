const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const textAll = [];
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    textAll.push(fs.readFileSync(path.join(d, f), 'utf-8'));
  }
}
const allText = textAll.join('\n');

// Broader scan - look for all patterns with count >= 4 that match common voice-cleanup structures
// Using regex to find sentence fragments that repeat
const re = /声音.{1,20}。/g;
const re2 = /音量.{1,20}。/g;
const re3 = /他还需要.{1,20}。/g;
const re4 = /韩冰.{1,20}声音.{1,20}。/g;
const re5 = /韩冰开口.{1,30}。/g;
const re6 = /赵大嘴.{1,20}声音.{1,20}。/g;
const re7 = /叶文轩.{1,20}声音.{1,20}。/g;

function scan(re, label) {
  const matches = allText.match(re) || [];
  const counts = {};
  for (const m of matches) {
    const key = m.slice(0, 30);
    counts[key] = (counts[key] || 0) + 1;
  }
  const sorted = Object.entries(counts).filter(([k,v]) => v >= 4).sort((a,b) => b[1] - a[1]);
  console.log('\n=== ' + label + ' ===');
  for (const [k,v] of sorted.slice(0, 40)) console.log(v + '\t' + k);
}

scan(re, '声音.');
scan(re2, '音量.');
scan(re3, '他还需要.');
scan(re4, '韩冰.*声音.');
scan(re5, '韩冰开口.');
scan(re6, '赵大嘴.*声音.');
scan(re7, '叶文轩.*声音.');