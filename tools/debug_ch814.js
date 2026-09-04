// Debug stripQuoted behavior
const fs = require('fs');
const content = fs.readFileSync('D:/work/yewenxuan_story/chapters/volume-6/chapter-814-polished.md', 'utf8');
const lines = content.split('\n');

// Test the actual stripQuoted regex from the check script
const regex = /"[^"]*"/g;

// Test on lines that should contain the bare sentence
const testLines = [9, 21, 29, 47, 59, 71, 85, 107, 119, 123, 143, 151, 167, 179, 185];
console.log('Testing 0429嗡鸣 family:');
for (const ln of testLines) {
  const line = lines[ln-1];
  if (!line) continue;
  const stripped = line.replace(/"[^"]*"/g, '');
  if (stripped.includes('叶文轩0429在叶文轩的脑子里嗡鸣')) {
    console.log('  Line ' + ln + ' MATCHES: ' + stripped.substring(0, 80));
  } else if (line.includes('嗡鸣')) {
    console.log('  Line ' + ln + ' no match after strip, original: ' + line.substring(0, 80));
  }
}

// Check if some lines use different quote chars
console.log('\nChecking quote chars around 嗡鸣 lines:');
for (const ln of [21, 71, 119]) {
  const line = lines[ln-1];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"' || line[i] === '"' || line[i] === '"') {
      console.log('  Line ' + ln + ' pos ' + i + ': ' + JSON.stringify(line[i]));
    }
  }
}
