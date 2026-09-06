// check_end_markers.js — Check the 12 MEDIUM end marker chapters
const fs = require('fs'), p = require('path');
function getFP(ch){const v=ch<=100?1:ch<=250?2:ch<=400?3:ch<=550?4:ch<=750?5:ch<=918?6:7;const n=ch<100?String(ch).padStart(2,'0'):String(ch).padStart(3,'0');return p.join('chapters','volume-'+v,'chapter-'+n+'-polished.md');}

const chs=[233,575,579,585,586,612,663,669,671,675,680,734];

for(const ch of chs){
  const t=fs.readFileSync(getFP(ch),'utf-8');
  const m=t.match(/（第[0-9一二三四五六七八九十百零千]+章完）/);
  console.log('ch'+ch+': '+(m?'end marker="'+m[0]+'"':'NO MATCH'));
  // Also show the last 200 chars
  const last200=t.slice(-200);
  // Find any line with 章完
  const lines=t.split('\n');
  const lastLines=lines.slice(-5).map((l,i)=>'  '+i+': '+l.slice(0,80));
  console.log(lastLines.join('\n'));
  console.log('');
}
