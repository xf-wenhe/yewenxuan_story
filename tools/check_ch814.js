const fs = require('fs');
const content = fs.readFileSync('D:/work/yewenxuan_story/chapters/volume-6/chapter-814-polished.md', 'utf8');
const line19 = content.split('\n')[18];
console.log('Line 19:');
for (let i = 0; i < Math.min(line19.length, 100); i++) {
  const ch = line19[i];
  const code = ch.charCodeAt(0);
  if (code > 127 || ch === '"' || ch === '\\') {
    console.log('  pos=' + i + ': U+' + code.toString(16).padStart(4,'0') + ' = ' + JSON.stringify(ch));
  }
}
