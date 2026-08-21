#!/usr/bin/env node
/*
Scan all polished chapters for blocking AI-pattern findings.
Outputs JSON array of {file, findings:[{name,line,text}], total}
to _blocking_findings.json for triage.
*/
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TOOL = path.join(ROOT, '.claude', 'skills', 'story-deslop', 'scripts', 'check-ai-patterns.js');
const CHAP = path.join(ROOT, 'chapters');

const BLOCKING_NAMES = new Set([
    'not-is-comparison','reverse-not-is','negation-parade','em-dash',
    'voice-contrast','trailer-ending','trailer-summary'
]);

// Regex patterns for mechanical fixing
const emdash_re = /——/g;
const negation_parade_re = /没有[，。]?没有[，。]?没有|没有[，]、没有[，]、没有/;
const not_is_re = /不是[^。是]{0,20}是[^\n。]{0,30}。/;
const reverse_re = /是[^。，]{0,20}，不是[^\n。]{0,30}。/;

// Collect all files
function collect(dir, out) {
    for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) collect(p, out);
        else if (/\d+-polished\.md$/.test(ent.name)) out.push(p);
    }
}
const files = [];
collect(CHAP, files);
files.sort();

console.log(`Found ${files.length} files, scanning for blocking findings...`);

// Batch scan: 20 files per JS invocation for speed
const BATCH = 20;
const results = [];
let done = 0;
for (let i=0; i<files.length; i+=BATCH) {
    const batch = files.slice(i, i+BATCH);
    const child = spawnSync('node', [TOOL, '--check', '--fail-on=blocking', ...batch], {
        encoding: 'utf-8',
        maxBuffer: 8*1024*1024
    });
    const out = (child.stdout||'') + (child.stderr||'');
    // Parse findings: lines like "path:line:col: [blocking] name: text (excerpt)"
    const lines = out.split('\n');
    for (const line of lines) {
        // Match: file:line:col: [blocking] finding-name:
        const m = line.match(/^(.*?chapters[\\/].+?):(\d+):(\d+):\s*\[blocking\]\s*([\w-]+):\s*(.+)$/);
        if (m) {
            const file = m[1];
            const finding = {
                file,
                line: parseInt(m[2]),
                col: parseInt(m[3]),
                name: m[4],
                text: m[5].trim()
            };
            results.push(finding);
        }
    }
    done += batch.length;
    if (done % 100 === 0) console.log(`  scanned ${done}/${files.length}`);
}

// Group by file
const byFile = new Map();
for (const f of results) {
    let arr = byFile.get(f.file);
    if (!arr) { byFile.set(f.file, arr = []); }
    arr.push(f);
}

// Determine machine-fixable categories per file
const emdash_files = [];
const negation_files = [];
const not_is_files = [];
const reverse_files = [];
const other_blocking = [];
const fixable = new Set();
const semi = new Set();

for (const [file, findings] of byFile) {
    const names = new Set(findings.map(f=>f.name));
    const hasEmdash = names.has('em-dash');
    const hasNeg = names.has('negation-parade');
    const hasNotIs = names.has('not-is-comparison');
    const hasRev = names.has('reverse-not-is');

    const fullFix = hasEmdash || hasNeg; // can regex-fix
    const partial = hasNotIs || hasRev;

    if (fullFix) fixable.add(file);
    else if (partial) semi.add(file);
    else other_blocking.push({file, names:[...names]});

    if (hasEmdash) emdash_files.push(file);
    if (hasNeg) negation_files.push(file);
    if (hasNotIs) not_is_files.push(file);
    if (hasRev) reverse_files.push(file);
}

const summary = {
    total_blocking_findings: results.length,
    files_with_blocking: byFile.size,
    by_name: {},
    by_file_sample: {},
    full_fix: emdash_files.length + negation_files.length,
    partial_fix: not_is_files.length + reverse_files.length,
    other: other_blocking.length
};
for (const f of results) {
    summary.by_name[f.name] = (summary.by_name[f.name]||0) + 1;
    if (!summary.by_file_sample[f.file]) summary.by_file_sample[f.file] = {count:0, names:new Set()};
    summary.by_file_sample[f.file].count++;
    summary.by_file_sample[f.file].names.add(f.name);
}
// Convert Sets in sample
for (const k of Object.keys(summary.by_file_sample)) {
    summary.by_file_sample[k].names = [...summary.by_file_sample[k].names];
}
summary.emdash_count = emdash_files.length;
summary.negation_count = negation_files.length;
summary.not_is_count = not_is_files.length;
summary.reverse_count = reverse_files.length;

console.log('\n=== BLOCKING FINDING SUMMARY ===');
console.log(JSON.stringify(summary, null, 2));

fs.writeFileSync(path.join(ROOT, '_blocking_findings.json'), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(ROOT, '_blocking_summary.json'), JSON.stringify(summary, null, 2));

// Write fixable/semi files for batch scripts
const fullFixList = Array.from(fixable);
const semiList = Array.from(semi);
fs.writeFileSync(path.join(ROOT, '_fixable_blocking.json'), JSON.stringify(fullFixList, null, 2));
fs.writeFileSync(path.join(ROOT, '_semi_fixable_blocking.json'), JSON.stringify(semiList, null, 2));
fs.writeFileSync(path.join(ROOT, '_other_blocking.json'), JSON.stringify(other_blocking, null, 2));

console.log(`\nFiles with em-dash: ${emdash_files.length}`);
console.log(`Files with negation-parade: ${negation_files.length}`);
console.log(`Files with not-is-comparison: ${not_is_files.length}`);
console.log(`Files with reverse-not-is: ${reverse_files.length}`);
console.log(`Other blocking: ${other_blocking.length}`);
console.log(`Full-fixable (emdash+neg): ${fullFixList.length}`);
console.log(`Semi-fixable (not-is+reverse): ${semiList.length}`);
console.log(`Written: _blocking_findings.json, _blocking_summary.json, _fixable_blocking.json, _semi_fixable_blocking.json, _other_blocking.json`);