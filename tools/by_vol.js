const d = require('../_blocking_findings.json');

const byVol = {};
const byName = {};
const byVolName = {};

for (const entry of d) {
  const m = entry.file.match(/volume-(\d)/);
  if (!m) continue;
  const v = 'V' + m[1];
  if (!byVol[v]) byVol[v] = { count: 0, files: new Set() };
  byVol[v].count++;
  byVol[v].files.add(entry.file);

  if (!byName[entry.name]) byName[entry.name] = 0;
  byName[entry.name]++;

  const key = v + ':' + entry.name;
  if (!byVolName[key]) byVolName[key] = 0;
  byVolName[key]++;
}

console.log('=== By Volume ===');
for (const [v, info] of Object.entries(byVol).sort()) {
  console.log(v + ': ' + info.count + ' findings in ' + info.files.size + ' files');
}

console.log('\n=== By Pattern Name ===');
for (const [n, c] of Object.entries(byName).sort((a, b) => b[1] - a[1])) {
  console.log(n + ': ' + c);
}

console.log('\n=== By Volume x Pattern ===');
for (const v of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7'].filter(v => byVol[v])) {
  console.log('\n' + v + ':');
  const names = Object.keys(byVolName).filter(k => k.startsWith(v + ':'));
  for (const n of names.sort((a, b) => byVolName[b] - byVolName[a])) {
    console.log('  ' + n.split(':')[1] + ': ' + byVolName[n]);
  }
}