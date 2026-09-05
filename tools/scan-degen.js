// scan-degen.js — Quick scan for remaining degeneration (3x+ repeated lines)
const fs = require('fs'), p = require('path');
function getFP(ch){const v=ch<=100?1:ch<=250?2:ch<=400?3:ch<=550?4:ch<=750?5:ch<=918?6:7;const n=ch<100?String(ch).padStart(2,'0'):String(ch).padStart(3,'0');return p.join('chapters','volume-'+v,'chapter-'+n+'-polished.md');}
let total=0;
for(let ch=1;ch<=1000;ch++){
  const fp=getFP(ch);if(!fs.existsSync(fp))continue;
  const text=fs.readFileSync(fp,'utf-8');
  const lines=text.split('\n').map(l=>l.trim()).filter(l=>l.length>=6&&l.length<60);
  const c={};for(const l of lines)c[l]=(c[l]||0)+1;
  for(const [l,n] of Object.entries(c))if(n>=3){console.log('ch'+ch+': "'+l.slice(0,40)+'..." x'+n);total++;}
}
console.log('TOTAL:',total);
