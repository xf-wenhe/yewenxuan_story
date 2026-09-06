// test_vol_marker2.js — Check exact bytes
const fs = require('fs'), p = require('path');
function getFP(ch){const v=ch<=100?1:ch<=250?2:ch<=400?3:ch<=550?4:ch<=750?5:ch<=918?6:7;const n=ch<100?String(ch).padStart(2,'0'):String(ch).padStart(3,'0');return p.join('chapters','volume-'+v,'chapter-'+n+'-polished.md');}

const t=fs.readFileSync(getFP(100),'utf-8');
// Find "第一卷" and show surrounding chars
const idx=t.indexOf('第一卷');
console.log('indexOf 第一卷: '+idx);
if(idx>=0){
  const ctx=t.slice(idx-5,idx+15);
  console.log('context: '+JSON.stringify(ctx));
  console.log('chars:');
  for(let i=idx-5;i<idx+15;i++){
    const c=t[i];
    console.log('  ['+i+'] U+'+c.charCodeAt(0).toString(16).padStart(4,'0')+' "'+c+'"');
  }
}
// Also check the em-dash
const emDash='——';
console.log('Em-dash chars:');
for(let i=0;i<emDash.length;i++){
  console.log('  ['+i+'] U+'+emDash[i].charCode().toString(16).padStart(4,'0')+' "'+emDash[i]+'"' );
}
