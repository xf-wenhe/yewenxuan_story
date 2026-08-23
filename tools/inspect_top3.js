const fs = require('fs');

function analyze(fp, ch) {
  const text = fs.readFileSync(fp, 'utf-8');
  const lines = text.split('\n');
  const marker = '（第' + ch + '章完）';

  console.log('=== ch' + ch + ' ===');
  console.log('Total lines:', lines.length);
  console.log('Has marker:', text.includes(marker));

  // Count CJK
  let cjk = 0;
  for (const c of text) if (c >= '一' && c <= '鿿') cjk++;
  console.log('Total CJK:', cjk);

  // Find end marker line
  const markerLine = lines.findIndex(l => l.includes(marker));
  console.log('Marker at line:', markerLine);

  // Show lines around the boundary between story and PAD
  // Story typically ends with content like "..." and PAD starts with generic sentences
  const PAD_START_MARKERS = ['沉默在两人之间蔓延', '这个念头一旦出现', '他没有急着做出判断', '夜里的风比他想象'];
  let padStart = -1;
  for (let i = 0; i < lines.length && padStart < 0; i++) {
    for (const pm of PAD_START_MARKERS) {
      if (lines[i].trim().includes(pm)) { padStart = i; break; }
    }
  }
  console.log('PAD start at line:', padStart);

  // Show story-to-PAD transition
  if (padStart >= 0) {
    console.log('\nStory → PAD transition (lines ' + (padStart-3) + ' to ' + (padStart+5) + '):');
    for (let i = Math.max(0, padStart-3); i <= Math.min(lines.length-1, padStart+5); i++) {
      const marker = i === padStart ? ' <-- PAD START' : '';
      console.log('  ' + (i+1) + ': ' + lines[i].slice(0, 80) + marker);
    }
  }

  // Show last 5 lines before marker
  if (markerLine >= 0) {
    console.log('\nLast 5 lines before marker:');
    for (let i = Math.max(0, markerLine-5); i <= markerLine; i++) {
      console.log('  ' + (i+1) + ': ' + lines[i].slice(0, 80));
    }
  }
  console.log();
}

analyze('chapters/volume-5/chapter-732-polished.md', 732);
analyze('chapters/volume-5/chapter-695-polished.md', 695);
analyze('chapters/volume-5/chapter-694-polished.md', 694);