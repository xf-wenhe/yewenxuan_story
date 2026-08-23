const fs = require('fs');

const toolCode = fs.readFileSync('tools/fix_mechanical.js', 'utf-8');
const fnStart = toolCode.indexOf('function collapsePeriodlessChains');
const fnEnd = toolCode.indexOf('function collapseSubjectRepetition');
const collapseFn = toolCode.slice(fnStart, fnEnd);
const fnStart2 = toolCode.indexOf('function collapseSubjectRepetition');
const fnEnd2 = toolCode.indexOf('return mod;', fnStart2) + 'return mod;'.length;
const collapseFn2 = toolCode.slice(fnStart2, fnEnd2);

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

eval(collapseFn + collapseFn2);

// Load ch565
const text = fs.readFileSync('chapters/volume-5/chapter-565-polished.md', 'utf-8');
const lines = text.split('\n');

// Test 1: core pattern
const test1 = '0429碎片在发热0429碎片在脉动0429碎片在对抗Ω协议0429碎片在侵蚀边界的结构0429碎片在扩大缝隙的宽度。';
const r1 = collapsePeriodlessChains(test1);
console.log('TEST1: ' + (r1 === '0429碎片在发热。' ? 'PASS' : 'FAIL'));
console.log('  IN:  ' + test1);
console.log('  OUT: ' + r1);

// Test 2: line 13 actual
const r2 = collapsePeriodlessChains(lines[12]);
console.log('\nTEST2 (line 13):');
console.log('  IN:  ' + lines[12]);
console.log('  OUT: ' + r2);

// Test 3: 0429备份
const test3 = '0429备份在跨越边界0429备份在连接两个锚点';
const r3 = collapsePeriodlessChains(test3);
console.log('\nTEST3: ' + (r3 === '0429备份在跨越边界' ? 'PASS' : 'FAIL'));
console.log('  IN:  ' + test3);
console.log('  OUT: ' + r3);

// Test 4: single occurrence (must NOT collapse)
const test4 = '0429碎片在发热';
const r4 = collapsePeriodlessChains(test4);
console.log('\nTEST4 (no collapse): ' + (r4 === '0429碎片在发热' ? 'PASS' : 'FAIL'));
console.log('  IN:  ' + test4);
console.log('  OUT: ' + r4);

// Test 5: embedded "在" in action
const test5 = '0429碎片在赵大嘴的手背上的蓝光在剧烈脉动0429碎片在对抗Ω协议0429碎片在侵蚀边界的结构。';
const r5 = collapsePeriodlessChains(test5);
console.log('\nTEST5 (embedded 在): ' + (r5 === '0429碎片在赵大嘴的手背上的蓝光在剧烈脉动。' ? 'PASS' : 'FAIL'));
console.log('  IN:  ' + test5);
console.log('  OUT: ' + r5);

// Test 6: line 31 - missing verb issue
console.log('\nTEST6 (line 31):');
console.log('  IN:  ' + lines[30]);
console.log('  OUT: ' + collapsePeriodlessChains(lines[30]));

// Test 7: line 39 - long actions
console.log('\nTEST7 (line 39):');
console.log('  IN:  ' + lines[38]);
console.log('  OUT: ' + collapsePeriodlessChains(lines[38]));

// Test 8: line 41 - chain with period
console.log('\nTEST8 (line 41):');
console.log('  IN:  ' + lines[40]);
console.log('  OUT: ' + collapsePeriodlessChains(lines[40]));

// Test 9: Pass 8 - subject repetition without "在"
const test9 = '0429碎片的设计者预见到了维护派0429碎片的设计者在0429碎片中植入了0429碎片的设计者是谁';
const r9 = collapseSubjectRepetition(test9);
console.log('\nTEST9 (Pass 8):');
console.log('  IN:  ' + test9);
console.log('  OUT: ' + r9);

// Test 10: ch565 full text - count CJK before/after
const fullBefore = countCjk(text);
const fullAfter = countCjk(collapsePeriodlessChains(text));
console.log('\nTEST10 (full ch565):');
console.log('  CJK before: ' + fullBefore + ', after: ' + fullAfter + ', delta: ' + (fullAfter - fullBefore));