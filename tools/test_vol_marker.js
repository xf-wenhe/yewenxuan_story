// test_vol_marker.js — Debug audit's volume marker check
const fs = require('fs'), p = require('path');
function getFP(ch){const v=ch<=100?1:ch<=250?2:ch<=400?3:ch<=550?4:ch<=750?5:ch<=918?6:7;const n=ch<100?String(ch).padStart(2,'0'):String(ch).padStart(3,'0');return p.join('chapters','volume-'+v,'chapter-'+n+'-polished.md');}

const volEnds = {100:'第一卷',250:'第二卷',400:'第三卷',550:'第四卷',750:'第五卷',918:'第六卷',1000:'第七卷'};
const volNames = {100:'入局',250:'边境',400:'裂谷',550:'深渊',750:'觉醒',918:'回廊',1000:'闭环'};

for(const ch of [100,250,400,550,750,918,1000]){
  const t=fs.readFileSync(getFP(ch),'utf-8');
  const check='——第'+volEnds[ch]+'·';
  console.log('ch'+ch+': check includes='+t.includes(check));
  const full='——第'+volEnds[ch]+'·'+volNames[ch]+'·完——';
  console.log('  full includes='+t.includes(full));
}
