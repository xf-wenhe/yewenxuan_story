// test_vol_marker3.js — Check if em-dash matches
const fs = require('fs'), p = require('path');
function getFP(ch){const v=ch<=100?1:ch<=250?2:ch<=400?3:ch<=550?4:ch<=750?5:ch<=918?6:7;const n=ch<100?String(ch).padStart(2,'0'):String(ch).padStart(3,'0');return p.join('chapters','volume-'+v,'chapter-'+n+'-polished.md');}

const t=fs.readFileSync(getFP(100),'utf-8');
// Extract the em-dash from the file itself
const idx=t.indexOf('第一卷');
const emDash=t.slice(idx-2,idx);
console.log('Em-dash from file: U+'+emDash.charCodeAt(0).toString(16));
console.log('Em-dash string: '+JSON.stringify(emDash));

// Now test includes with the exact em-dash from the file
const testStr=emDash+'第一卷·';
console.log('Test string: '+JSON.stringify(testStr));
console.log('includes test: '+t.includes(testStr));

// Also try the literal em-dash
const emDash2='——';
console.log('Literal em-dash: U+'+emDash2.charCodeAt(0).toString(16));
console.log('Literal includes: '+t.includes(emDash2+'第一卷·'));

// Now try with the full string from the audit
const auditStr='——第'+'第一卷'+'·';
console.log('Audit string: '+JSON.stringify(auditStr));
console.log('Audit string em-dash code: U+'+auditStr.charCodeAt(0).toString(16));
console.log('Audit includes: '+t.includes(auditStr));
