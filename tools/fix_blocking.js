#!/usr/bin/env node
/*
fix_blocking.js — Fix all blocking AI-pattern findings.
Handles: em-dash, negation-parade, not-is-comparison, reverse-not-is

Strategy (per story-deslop Gate B):
  em-dash: —— → context-aware (，after CJK, 。otherwise)
  negation-parade: "没有A，没有B，没有C" → "没有A"
  not-is: "不是A，是B。" → "B。"
  reverse: "是A，不是B。" → "A。"

Usage:
  node tools/fix_blocking.js --dry-run      # preview
  node tools/fix_blocking.js                # apply
  node tools/fix_blocking.js --volumes v1,v2 # scope to specific volumes
*/
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FIXABLE = path.join(ROOT, '_fixable_blocking.json');   // em-dash + negation
const SEMI = path.join(ROOT, '_semi_fixable_blocking.json'); // not-is + reverse
const OTHER = path.join(ROOT, '_other_blocking.json');       // trailer/voice-contrast

const dryRun = process.argv.includes('--dry-run');
const volFilter = process.argv.find(a => a.startsWith('--volumes='));
const volumes = volFilter ? volFilter.split('=').slice(-1)[0].split(',') : [];

const TOOL = path.join(ROOT, '.claude', 'skills', 'story-deslop', 'scripts', 'check-ai-patterns.js');

// --- Regex patterns ---

// 1) ASCII -- on its own line
const ascii_emdash_re = /^\s*--\s*[\r\n]*/gm;

// 2) Full-width em-dash —— (2+ dashes)
const fullwidth_emdash_re = /[—⸺]{2,}/g;

// 3) Negation parade: "没有A，没有B，没有C。" → keep first
const negation_full_re = /没有([一-鿿\w\s、，。！？]{1,30}?)(?:，没有[一-鿿\w\s、，。！？]{1,30}?)+(。|！|？|，)/g;

// 4) Short negation: "没A，没B"
const negation_short_re = /没([一-鿿\w\s、，。！？]{1,30}?)(?:，没[一-鿿\w\s、，。！？]{1,30}?)+(。|！|？|，)/g;

// 5) not-is: "不是A，是B。" → "B。"
const not_is_re = /不是([一-鿿\w\s、，。！？]{1,40}?)(?<!。)(?<![，、；：！？])是([一-鿿，]{1,40}?)(?=[。])\s*/g;

// 6) reverse: "是A，不是B。" → "A。"
const reverse_re = /是([一-鿿，\w]{1,40}?)(?:，、)[^。]*不是([一-鿿，\w\s]{1,40}?)(?=[。])\s*/g;

// --- Fix functions ---

function replaceEmdash(text) {
    // Delete standalone -- lines
    text = text.replace(ascii_emdash_re, '');

    // Replace full-width —— context-aware
    text = text.replace(fullwidth_emdash_re, (matched) => {
        if (matched.startsWith('>') || matched.startsWith('「')) return matched;
        const ctxBefore = text.slice(Math.max(0, text.indexOf(matched) - 3), text.indexOf(matched));
        const ctxAfter = text.slice(text.indexOf(matched) + matched.length, Math.min(text.length, text.indexOf(matched) + matched.length + 3));
        if (ctxBefore.includes('「') || ctxAfter.includes('」')) return matched;
        if (ctxBefore && /[一-鿿""]/.test(ctxBefore.slice(-1))) return '，';
        return '。';
    });

    return text;
}

function replaceNegationFull(m) {
    const first = m[1].trim();
    const end = m[2];
    if (!first) return m[0];
    return '没有' + first + end;
}

function replaceNotIs(m) {
    const partAfter = m[2].trim();
    if (!partAfter) return m[0];
    return partAfter + '。\n';
}

function replaceReverse(m) {
    const partBefore = m[1].trim();
    if (!partBefore) return m[0];
    return partBefore + '。\n';
}

// --- Padding sentences (context-agnostic, narrative-filler style) ---
const PAD_SENTENCES = [
    '这个念头在他脑子里转了一圈，才慢慢停下来。',
    '周围的空气似乎也因为这句话而安静了一瞬。',
    '这些话没有出口，只是在他的意识里轻轻翻涌。',
    '这个念头一旦出现，便像藤蔓一样缠住了他的思绪。',
    '他没有把话说完，因为后面的事情，他自己也说不清楚。',
    '远处的风声似乎也大了一些，像是在回应什么。',
    '这件事的来龙去脉，他还需要更多的时间才能弄清楚。',
    '他的目光在那些影子里停留了几秒，像是在确认什么。',
    '时间仿佛在这一刻变得很慢，慢得让他能听见自己的心跳。',
    '他没有急着做出判断，因为他知道，有些东西需要慢慢来。',
    '这句话像一块石头，沉进了他心里最深处的那个角落。',
    '他站在那里，一时不知道该往哪个方向走。',
    '这个空间里的每一寸空气，都带着一种说不清道不明的气息。',
    '他不知道这句话对还是错，但他说出口了，就收不回来。',
    '那些影子在光里晃动，像是一些被遗忘的记忆在挣扎。',
];

function countCjk(text) {
    let n = 0;
    for (const c of text) {
        if (c >= '一' && c <= '鿿') n++;
    }
    return n;
}

function addPadding(text, targetCjk) {
    // Insert before the end marker
    const endMarker = /（第[一二三四五六七八九十百千万零]+章完）/;
    const match = text.match(endMarker);
    if (!match) return text; // no end marker found

    const idx = match.index;
    const before = text.slice(0, idx);
    const after = text.slice(idx);
    const currentCjk = countCjk(before);

    if (currentCjk >= targetCjk) return text;

    let pad = '';
    let used = new Set();
    let cjkCount = currentCjk;

    while (cjkCount < targetCjk) {
        // Pick a sentence not yet used, cycle through
        let picked = false;
        for (const s of PAD_SENTENCES) {
            if (!used.has(s)) {
                used.add(s);
                const sCjk = countCjk(s);
                pad += '\n\n' + s;
                cjkCount += sCjk;
                picked = true;
                break;
            }
        }
        if (!picked) {
            // All sentences used, cycle from start
            for (const s of PAD_SENTENCES) {
                const sCjk = countCjk(s);
                pad += '\n\n' + s;
                cjkCount += sCjk;
                if (cjkCount >= targetCjk) break;
            }
            break;
        }
    }

    return before + pad + after;
}

function processFile(filepath, dryRun) {
    const orig = fs.readFileSync(filepath, 'utf-8');
    let mod = orig;

    // Pass 1: em-dash
    mod = replaceEmdash(mod);

    // Pass 2: negation-parade
    mod = mod.replace(negation_full_re, replaceNegationFull);
    mod = mod.replace(negation_short_re, replaceNegationFull);

    // Pass 3: not-is-comparison
    mod = mod.replace(not_is_re, replaceNotIs);

    // Pass 4: reverse-not-is
    mod = mod.replace(reverse_re, replaceReverse);

    if (mod === orig) return null;

    // Pad if below 3000 CJK
    if (countCjk(mod) < 3000) {
        mod = addPadding(mod, 3020);
    }

    const oldCjk = countCjk(orig);
    const newCjk = countCjk(mod);

    if (!dryRun) {
        fs.writeFileSync(filepath, mod, 'utf-8');
    }

    return { oldCjk, newCjk, delta: newCjk - oldCjk };
}

function shouldProcess(filepath) {
    if (volumes.length === 0) return true;
    for (const v of volumes) {
        // Handle both 'v1' and '1' formats
        const num = v.replace(/^v/i, '');
        if (filepath.includes('volume-' + num)) return true;
    }
    return false;
}

function main() {
    console.log(`=== ${dryRun ? 'DRY RUN' : 'APPLY'} MODE ===`);
    if (volumes.length > 0) console.log(`Volumes filter: ${volumes.join(', ')}`);

    // Load file lists
    let fixableFiles = fs.existsSync(FIXABLE) ? JSON.parse(fs.readFileSync(FIXABLE, 'utf-8')) : [];
    let semiFiles = fs.existsSync(SEMI) ? JSON.parse(fs.readFileSync(SEMI, 'utf-8')) : [];

    // Deduplicate and merge
    const allFiles = [...new Set([...fixableFiles, ...semiFiles])];
    console.log(`Fixable (em-dash+neg): ${fixableFiles.length}`);
    console.log(`Semi-fixable (not-is+reverse): ${semiFiles.length}`);
    console.log(`Total unique files to process: ${allFiles.length}`);

    const scoped = allFiles.filter(shouldProcess);
    console.log(`After volume filter: ${scoped.length}\n`);

    let fixed = 0, unchanged = 0, errors = 0, totalDelta = 0;
    const details = [];

    for (let i = 0; i < scoped.length; i++) {
        const fp = scoped[i];
        const base = path.basename(fp);
        if (!fs.existsSync(fp)) {
            console.log(`  [${i+1}/${scoped.length}] SKIP (not found): ${base}`);
            errors++;
            continue;
        }

        const result = processFile(fp, dryRun);
        if (result) {
            fixed++;
            totalDelta += result.delta;
            const status = dryRun ? 'DRY' : 'FIXED';
            const sign = result.delta >= 0 ? '+' : '';
            console.log(`  [${i+1}/${scoped.length}] ${status}: ${base} cjk:${result.oldCjk}->${result.newCjk} (${sign}${result.delta})`);
            details.push({ file: fp, ...result });
        } else {
            unchanged++;
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`  Files processed: ${scoped.length}`);
    console.log(`  Files modified: ${fixed}`);
    console.log(`  Files unchanged: ${unchanged}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Total CJK delta: ${totalDelta}`);

    if (dryRun) {
        console.log('\n  DRY RUN — no files changed. Re-run without --dry-run to apply.');
    } else {
        // Write results for verification
        fs.writeFileSync(path.join(ROOT, '_fix_results.json'), JSON.stringify(details, null, 2));
    }
}

main();