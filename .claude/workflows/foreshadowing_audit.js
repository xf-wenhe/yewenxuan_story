export const meta = {
  name: 'foreshadowing-payoff-audit',
  description: 'Audit 228 unresolved foreshadowing entries across V1-V6',
  phases: [{ title: 'Audit', detail: '6 parallel agents verify payoffs in their assigned volume' }]
}

const FINDING_SCHEMA = {
  type: 'object',
  properties: {
    volume: { type: 'string' },
    chapterRange: { type: 'string' },
    totalEntriesAudited: { type: 'number' },
    payoffPresent: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          vid: { type: 'string' },
          payoffChapter: { type: 'number' },
          evidence: { type: 'string' }
        },
        required: ['vid', 'payoffChapter', 'evidence']
      }
    },
    payoffMissing: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          vid: { type: 'string' },
          payoffChapter: { type: 'number' },
          threadContent: { type: 'string' },
          chapterSummary: { type: 'string' },
          diagnosis: { type: 'string' }
        },
        required: ['vid', 'payoffChapter', 'threadContent', 'chapterSummary', 'diagnosis']
      }
    },
    chapterNotFound: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' }
  },
  required: ['volume', 'chapterRange', 'totalEntriesAudited', 'payoffPresent', 'payoffMissing', 'chapterNotFound', 'summary']
}

const BASE = '/Volumes/新/work/story/story-project'

const VOLUMES = [
  { vol: 'volume-1', chRange: '1-100', lo: 54, hi: 100 },
  { vol: 'volume-2', chRange: '101-250', lo: 110, hi: 250 },
  { vol: 'volume-3', chRange: '251-400', lo: 280, hi: 400 },
  { vol: 'volume-4', chRange: '401-550', lo: 420, hi: 550 },
  { vol: 'volume-5', chRange: '551-750', lo: 600, hi: 726 },
  { vol: 'volume-6', chRange: '751-918', lo: 800, hi: 900 },
]

phase('Audit')

function makePrompt(v) {
  return (
    'You are auditing foreshadowing payoff delivery for volume ' + v.vol + ' (Ch.' + v.chRange + ') of a Chinese web novel.\n\n' +
    '## Your task\n' +
    'Read plot-threads.md to find ALL entries with status ⏳ or 🔴 whose 应回收章节 chapter number falls between ' + v.lo + ' and ' + v.hi + ' inclusive.\n' +
    'For each such entry, read the target chapter file and determine if the promised payoff actually appears.\n\n' +
    '## Repository\n' +
    '- Foreshadowing table: ' + BASE + '/plot-threads.md\n' +
    '- Chapter files: ' + BASE + '/chapters/' + v.vol + '/chapter-NNN-polished.md (3-digit zero-padded, e.g. chapter-350-polished.md)\n\n' +
    '## Method\n' +
    '1. Read ' + BASE + '/plot-threads.md in full\n' +
    '2. Find ALL entries where status is ⏳ or 🔴 (not ✅) and the 应回收章节 chapter number is between ' + v.lo + ' and ' + v.hi + '\n' +
    '3. For each entry, read the target chapter file\n' +
    '4. Judge: does the promised content from 内容描述 appear in that chapter?\n' +
    '   - payoffPresent = content is clearly delivered\n' +
    '   - payoffMissing = chapter exists but does NOT contain this content\n' +
    '   - chapterNotFound = file does not exist\n\n' +
    '## Keywords to search for (use these to verify payoff content)\n' +
    '- Fragment IDs: 0428, 0429, 0415, 0426, 0000\n' +
    '- Characters: 叶文轩, 赵大嘴, 赵磊, 韩冰, 沈知秋, 朵朵, 陈小鱼, 林渊, 孙鹏\n' +
    '- Places: 疗养院, 归位之门, 中枢, 深井, 核心区, 数字空间\n' +
    '- Concepts: 闭环, 结构透视, 洞察者, 锚点, 认知抑制, 记忆碎片, 系统, 觉醒者\n\n' +
    '## Output\n' +
    'Return ONLY the JSON object per the schema. For each entry found:\n' +
    '- If payoffPresent: include vid, payoffChapter, and evidence (1 sentence quote/description)\n' +
    '- If payoffMissing: include vid, payoffChapter, threadContent (what was promised), chapterSummary (what chapter actually contains), diagnosis\n' +
    '- If chapterNotFound: just the chapter number as string\n\n' +
    'Be strict: only mark payoffPresent if you find clear evidence in the chapter text. When in doubt, mark payoffMissing with diagnosis=too_subtle_to_verify.\n'
  )
}

const results = await parallel(VOLUMES.map(function(v) {
  return function() {
    return agent(makePrompt(v), {
      label: 'audit-' + v.vol,
      phase: 'Audit',
      schema: FINDING_SCHEMA,
      effort: 'high'
    })
  }
}))

var valid = results.filter(Boolean)
var allPresent = []
var allMissing = []
var allNotFound = []
var totalAudited = 0

for (var i = 0; i < valid.length; i++) {
  var r = valid[i]
  totalAudited += r.totalEntriesAudited || 0
  allPresent = allPresent.concat(r.payoffPresent.map(function(e) { return e }))
  allMissing = allMissing.concat(r.payoffMissing.map(function(e) { return e }))
  allNotFound = allNotFound.concat(r.chapterNotFound)
}

log('Audit complete: ' + totalAudited + ' entries across 6 volumes')
log('Payoff present: ' + allPresent.length + ' | Missing: ' + allMissing.length + ' | Chapters not found: ' + allNotFound.length)

var perVolume = valid.map(function(r) {
  return {
    volume: r.volume,
    chapterRange: r.chapterRange,
    totalEntriesAudited: r.totalEntriesAudited,
    present: r.payoffPresent.length,
    missing: r.payoffMissing.length,
    notFound: r.chapterNotFound.length,
    summary: r.summary
  }
})

return {
  totalAudited: totalAudited,
  allPresent: allPresent,
  allMissing: allMissing,
  allNotFound: allNotFound,
  perVolume: perVolume
}
