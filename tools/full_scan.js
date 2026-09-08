// full_scan.js — Run check-degeneration + check-ai-patterns + normalize-punctuation on all 1000 chapters
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPTS = 'D:\\work\\yewenxuan_story\\.claude\\skills\\story-deslop\\scripts';
const CHAPTERS = 'D:\\work\\yewenxuan_story\\chapters';

// Collect all chapter files
function getChapterFiles() {
  const files = [];
  const volumes = fs.readdirSync(CHAPTERS);
  for (const vol of volumes.sort()) {
    const volPath = path.join(CHAPTERS, vol);
    if (!fs.statSync(volPath).isDirectory()) continue;
    const chFiles = fs.readdirSync(volPath).filter(f => f.match(/^chapter-\d+-polished\.md$/));
    for (const f of chFiles) {
      const num = parseInt(f.match(/^chapter-(\d+)/)[1]);
      files.push({ num, path: path.join(volPath, f) });
    }
  }
  files.sort((a, b) => a.num - b.num);
  return files;
}

const files = getChapterFiles();
console.log(`Total chapter files: ${files.length}`);

// Process in batches of 100 for memory efficiency
const BATCH = 100;
let totalFindings = { degeneration: 0, aiPatterns: 0, punctuation: 0 };
let degenerationFiles = [];
let aiPatternFiles = [];
let punctuationFiles = [];

for (let i = 0; i < files.length; i += BATCH) {
  const batch = files.slice(i, i + BATCH);
  const batchPaths = batch.map(f => f.path);
  const pathsStr = batchPaths.join(' ');

  // --- check-degeneration ---
  try {
    const out = execSync(`node "${SCRIPTS}\\check-degeneration.js" --json --fail-on=blocking ${batchPaths.map(p => `"${p}"`).join(' ')}`, {
      timeout: 120000, maxBuffer: 10*1024*1024
    }).toString();
    const results = JSON.parse(out);
    for (const r of results) {
      if (r.findings && r.findings.length > 0) {
        const chNum = batch.find(f => f.path === r.file)?.num;
        degenerationFiles.push({ ch: chNum, findings: r.findings.length });
      }
    }
  } catch (e) {
    // If exit code 1, it means findings were found
    try {
      const out = e.stdout.toString();
      const results = JSON.parse(out);
      for (const r of results) {
        if (r.findings && r.findings.length > 0) {
          const chNum = batch.find(f => f.path === r.file)?.num;
          degenerationFiles.push({ ch: chNum, findings: r.findings.length });
        }
      }
    } catch (e2) {
      console.error(`degeneration batch ${i} error: ${e.message}`);
    }
  }

  // --- check-ai-patterns ---
  try {
    const out = execSync(`node "${SCRIPTS}\\check-ai-patterns.js" --json --fail-on=blocking ${batchPaths.map(p => `"${p}"`).join(' ')}`, {
      timeout: 120000, maxBuffer: 10*1024*1024
    }).toString();
    const results = JSON.parse(out);
    for (const r of results) {
      if (r.findings && r.findings.length > 0) {
        const chNum = batch.find(f => f.path === r.file)?.num;
        aiPatternFiles.push({ ch: chNum, findings: r.findings.length });
      }
    }
  } catch (e) {
    try {
      const out = e.stdout.toString();
      const results = JSON.parse(out);
      for (const r of results) {
        if (r.findings && r.findings.length > 0) {
          const chNum = batch.find(f => f.path === r.file)?.num;
          aiPatternFiles.push({ ch: chNum, findings: r.findings.length });
        }
      }
    } catch (e2) {
      console.error(`ai-patterns batch ${i} error: ${e.message}`);
    }
  }

  // --- normalize-punctuation ---
  try {
    const out = execSync(`node "${SCRIPTS}\\normalize-punctuation.js" --check --json ${batchPaths.map(p => `"${p}"`).join(' ')}`, {
      timeout: 120000, maxBuffer: 10*1024*1024
    }).toString();
    const results = JSON.parse(out);
    for (const r of results) {
      if (r.findings && r.findings.length > 0) {
        const chNum = batch.find(f => f.path === r.file)?.num;
        punctuationFiles.push({ ch: chNum, findings: r.findings.length });
      }
    }
  } catch (e) {
    try {
      const out = e.stdout.toString();
      const results = JSON.parse(out);
      for (const r of results) {
        if (r.findings && r.findings.length > 0) {
          const chNum = batch.find(f => f.path === r.file)?.num;
          punctuationFiles.push({ ch: chNum, findings: r.findings.length });
        }
      }
    } catch (e2) {
      console.error(`punctuation batch ${i} error: ${e.message}`);
    }
  }

  if ((i / BATCH) % 5 === 0) {
    console.log(`Processed ${Math.min(i + BATCH, files.length)}/${files.length}...`);
  }
}

// --- RESULTS ---
console.log(`\n=== SCAN RESULTS ===`);
console.log(`\n--- Degeneration findings (${degenerationFiles.length} files) ---`);
if (degenerationFiles.length > 0) {
  // Sort by chapter number
  degenerationFiles.sort((a, b) => a.ch - b.ch);
  for (const d of degenerationFiles) {
    console.log(`  ch${d.ch}: ${d.findings} finding(s)`);
  }
} else {
  console.log('  None');
}

console.log(`\n--- AI Patterns findings (${aiPatternFiles.length} files) ---`);
if (aiPatternFiles.length > 0) {
  aiPatternFiles.sort((a, b) => a.ch - b.ch);
  for (const d of aiPatternFiles) {
    console.log(`  ch${d.ch}: ${d.findings} finding(s)`);
  }
} else {
  console.log('  None');
}

console.log(`\n--- Punctuation findings (${punctuationFiles.length} files) ---`);
if (punctuationFiles.length > 0) {
  punctuationFiles.sort((a, b) => a.ch - b.ch);
  // Show first 50 and last 20
  if (punctuationFiles.length > 70) {
    for (const d of punctuationFiles.slice(0, 50)) {
      console.log(`  ch${d.ch}: ${d.findings} finding(s)`);
    }
    console.log(`  ... (${punctuationFiles.length - 70} more) ...`);
    for (const d of punctuationFiles.slice(-20)) {
      console.log(`  ch${d.ch}: ${d.findings} finding(s)`);
    }
  } else {
    for (const d of punctuationFiles) {
      console.log(`  ch${d.ch}: ${d.findings} finding(s)`);
    }
  }
} else {
  console.log('  None');
}
