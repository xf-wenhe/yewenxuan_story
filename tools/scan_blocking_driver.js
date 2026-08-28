// driver.js — batch blocking-pattern scan driver
// Calls scanDocument directly per file to avoid per-file node-spawn overhead.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DETECTOR = path.resolve(process.argv[2]);
const OUT_JSON = path.resolve(process.argv[3]);
const OUT_STAT = path.resolve(process.argv[4]);

const src = fs.readFileSync(DETECTOR, 'utf8').replace(/^#!.*\n/, '');
// Prevent the detector's process.exit / die() from killing the driver.
const wrapped = `
  process.exit = function() {};
  ${src}
`;
const sandbox = vm.createContext({
  console,
  process: Object.assign({ argv: ['node', 'check-ai-patterns.js'], exit: function() {} }, process),
  require, module: {}, exports: {}, __filename: DETECTOR, __dirname: path.dirname(DETECTOR)
});
try { vm.runInContext(wrapped, sandbox, { filename: DETECTOR }); }
catch (e) {
  if (e.exitCode !== 0) throw e;
}
const scanDocument = sandbox.scanDocument;
if (typeof scanDocument !== 'function') throw new Error('scanDocument not exposed');

const volumes = [
  { n: '1', lo: 1,   hi: 100 },
  { n: '2', lo: 101, hi: 250 },
  { n: '3', lo: 251, hi: 400 },
  { n: '4', lo: 401, hi: 550 },
  { n: '5', lo: 551, hi: 750 },
  { n: '6', lo: 751, hi: 918 },
  { n: '7', lo: 919, hi: 1000 }
];
const SCAN_LO = 61;
const root = path.dirname(path.dirname(DETECTOR)); // .../story-deslop/scripts -> repo root? no.
// root = repo root, pass via argv
const repoRoot = path.resolve(process.argv[5]);

const summary = [];      // { ch, volume, types, count, findings }
const stats = [];
let total = 0, blocking = 0, missing = 0, errors = 0;
const t0 = Date.now();

for (const v of volumes) {
  const lo = Math.max(v.lo, SCAN_LO);
  if (lo > v.hi) continue;
  for (let ch = lo; ch <= v.hi; ch++) {
    total++;
    const fpath = path.join(repoRoot, 'chapters', `volume-${v.n}`, `chapter-${ch}-polished.md`);
    let text;
    try { text = fs.readFileSync(fpath, 'utf8'); }
    catch (e) {
      missing++;
      stats.push(`MISSING ch.${ch}`);
      continue;
    }
    let findings;
    try { findings = scanDocument(text); }
    catch (e) {
      errors++;
      stats.push(`ERR ch.${ch} ${e.message}`);
      continue;
    }
    const blk = findings.filter(f => f.severity === 'blocking');
    if (blk.length > 0) {
      blocking++;
      const types = [...new Set(blk.map(f => f.type))].sort();
      summary.push({ ch, volume: v.n, count: blk.length, totalFindings: findings.length, types });
      stats.push(`${ch}`);
    }
    if (total % 100 === 0) {
      const t = ((Date.now() - t0) / 1000).toFixed(1);
      console.error(`  scanned ${total} / 940  (${blocking} blocking, ${missing} missing, ${errors} errors)  ${t}s`);
    }
  }
}
const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
fs.writeFileSync(OUT_JSON, JSON.stringify({ total, blocking, missing, errors, elapsed: `${elapsed}s`, chapters: summary }, null, 2), 'utf8');
fs.writeFileSync(OUT_STAT, `total=${total} blocking=${blocking} missing=${missing} errors=${errors} elapsed=${elapsed}s\nchapters_with_blocking:\n${stats.join('\n')}\n`, 'utf8');
console.error(`DONE: total=${total} blocking=${blocking} missing=${missing} errors=${errors} elapsed=${elapsed}s`);
console.error(`JSON -> ${OUT_JSON}`);
console.error(`STAT -> ${OUT_STAT}`);
