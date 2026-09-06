// verify_final.js — Final verification
const fs = require('fs'), p = require('path');
function getFP(ch){const v=ch<=100?1:ch<=250?2:ch<=400?3:ch<=550?4:ch<=750?5:ch<=918?6:7;const n=ch<100?String(ch).padStart(2,'0'):String(ch).padStart(3,'0');return p.join('chapters','volume-'+v,'chapter-'+n+'-polished.md');}

let bom=0,curly=0,trad=0,shuoDao=0,below3000=0,totalCjk=0;
const tradChars=['葉','軒','趙','裡','動','輕','從','覺','閉','環','說','嚨','臉','開','張','體','發','軟','詞','顆','虛','難'];

for(let ch=1;ch<=1000;ch++){
  const buf=fs.readFileSync(getFP(ch));
  if(buf[0]===0xEF&&buf[1]===0xBB&&buf[2]===0xBF)bom++;
  const text=fs.readFileSync(getFP(ch),'utf-8');
  if(text.includes('“')||text.includes('”'))curly++;
  for(const t of tradChars)if(text.includes(t)){trad++;break;}
  shuoDao+=(text.match(/说道/g)||[]).length;
  let c=0;for(const c2 of text){if(c2>='一'&&c2<='鿿')c++;}
  totalCjk+=c;if(c<3000)below3000++;
}

const vms=[
  {ch:100,m:'——第一卷·入局·完——'},
  {ch:250,m:'——第二卷·边境·完——'},
  {ch:400,m:'——第三卷·裂谷·完——'},
  {ch:550,m:'——第四卷·深渊·完——'},
  {ch:750,m:'——第五卷·觉醒·完——'},
  {ch:918,m:'——第六卷·回廊·完——'},
  {ch:1000,m:'——第七卷·闭环·完——'},
];

console.log('=== FINAL VERIFICATION ===');
console.log('BOM: '+bom);
console.log('弯引号: '+curly);
console.log('繁体: '+trad);
console.log('说道: '+shuoDao);
console.log('低于3000: '+below3000);
console.log('总CJK: '+totalCjk.toLocaleString());
console.log('');
for(const v of vms){
  const t=fs.readFileSync(getFP(v.ch),'utf-8');
  console.log('ch'+v.ch+': '+(t.includes(v.m)?'✓':'✗'));
}
console.log('');
for(const ch of [1,100,200,300,400,500,600,750,918,1000]){
  const t=fs.readFileSync(getFP(ch),'utf-8');
  const line=t.split('\n').find(l=>l.startsWith('#'));
  console.log('ch'+ch+': '+line);
}
