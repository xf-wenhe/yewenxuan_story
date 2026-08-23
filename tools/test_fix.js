const fs = require('fs');

const toolCode = fs.readFileSync('tools/fix_mechanical.js', 'utf-8');

function extractFunction(code, name) {
  const start = code.indexOf('function ' + name);
  if (start < 0) return '';
  // Find the opening brace
  const braceStart = code.indexOf('{', start);
  let depth = 0;
  let i = braceStart;
  while (i < code.length) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) return code.slice(start, i + 1);
    }
    i++;
  }
  return '';
}

const fn1 = extractFunction(toolCode, 'collapsePeriodlessChains');
const fn2 = extractFunction(toolCode, 'collapseSubjectRepetition');

if (!fn1 || !fn2) {
  console.error('FAIL: could not extract functions');
  console.error('fn1 length:', fn1.length, 'fn2 length:', fn2.length);
  process.exit(1);
}

eval(fn1 + '\n' + fn2);

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

function test(label, input, expected) {
  const r = collapsePeriodlessChains(input);
  const ok = r === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label);
  if (!ok) {
    console.log('  EXPECTED: ' + expected);
    console.log('  GOT:      ' + r);
  }
}

console.log('=== Pass 7 tests ===');
test('T1', '0429碎片在发热0429碎片在脉动0429碎片在对抗Ω协议0429碎片在侵蚀边界的结构0429碎片在扩大缝隙的宽度。', '0429碎片在发热。');
test('T3', '0429备份在跨越边界0429备份在连接两个锚点', '0429备份在跨越边界');
test('T4', '0429碎片在发热', '0429碎片在发热');
test('T5', '0429碎片在赵大嘴的手背上的蓝光在剧烈脉动0429碎片在对抗Ω协议0429碎片在侵蚀边界的结构。', '0429碎片在赵大嘴的手背上的蓝光在剧烈脉动。');
test('T6', '0429碎片在赵大嘴的体内Ω协议0429碎片在侵蚀边界的结构0429碎片在扩大缝隙的宽度。', '0429碎片在赵大嘴的体内Ω协议。');

console.log('\n=== Full line tests (ch565) ===');
const text = fs.readFileSync('chapters/volume-5/chapter-565-polished.md', 'utf-8');
const lines = text.split('\n');
for (const lineIdx of [12, 30, 38, 40, 41, 59, 87, 121, 123, 129, 131]) {
  const orig = lines[lineIdx];
  const r = collapsePeriodlessChains(orig);
  if (r !== orig) {
    console.log('\nLINE ' + (lineIdx + 1) + ':');
    console.log('  IN:  ' + orig);
    console.log('  OUT: ' + r);
  }
}

console.log('\n=== Full ch565 ===');
const fullBefore = countCjk(text);
const fullAfter = countCjk(collapsePeriodlessChains(text));
console.log('  CJK before: ' + fullBefore + ', after: ' + fullAfter + ', delta: ' + (fullAfter - fullBefore));

console.log('\n=== Pass 8 tests ===');
testPass8('P8T1', '0429碎片的设计者预见到了维护派0429碎片的设计者在0429碎片中植入了0429碎片的设计者是谁', '0429碎片的设计者预见到了维护派');
testPass8('P8T2', '0429碎片在赵大嘴的体内0429碎片在赵大嘴的神经通路中0429碎片在赵大嘴的记忆中', '0429碎片在赵大嘴的体内');
// P8T3: "0429碎片"(6chars) appears 3x — function correctly collapses
testPass8('P8T3_3x_0429碎片', '0429碎片的设计者预见到了维护派0429碎片的设计者在0429碎片中植入了', '0429碎片的设计者预见到了维护派');

function testPass8(label, input, expected) {
  const r = collapseSubjectRepetition(input);
  const ok = r === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label);
  if (!ok) {
    console.log('  EXPECTED: ' + expected);
    console.log('  GOT:      ' + r);
  }
}