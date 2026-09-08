import re, os, json

V5_DIR = 'D:/work/yewenxuan_story/chapters/volume-5'
DEFERRED = set(range(631, 641)) | {659}

# Ordered replacements: specific compound patterns first, then generic, then standalone
# System-entity "在说/在发光" patterns (mechanical, safe)
# Semi-mechanical narrative patterns (person speaking — just remove 在)
REPLACEMENTS = [
    # ---- Specific compound system patterns (before generic) ----
    ('记忆光点在说：', '记忆光点传来信号：'),
    ('0428备份的信号在说：', '0428备份的信号传来：'),

    # ---- Generic system patterns (catch all compound forms) ----
    # 光点在说 catches standalone + 记忆光点 if not caught above
    ('光点在说：', '光点传来信号：'),
    # 碎片在说 catches 0429碎片, 0428碎片, 0415碎片, standalone
    ('碎片在说：', '碎片传来信号：'),
    # 备份在说 catches 0429备份, 0428备份, 0429的备份, standalone
    ('备份在说：', '备份传来信号：'),
    # 备份在发光 catches 0428备份在发光 (all 31 instances)
    ('备份在发光：', '备份传来信号：'),

    # ---- Specific standalone system entities ----
    ('光体在说：', '光体传来信号：'),
    ('记忆库在说：', '记忆库传来信号：'),
    ('闭环在说：', '闭环传来信号：'),
    ('归位之门在说：', '归位之门传来信号：'),
    ('桥梁在说：', '桥梁传来信号：'),
    ('面板在说：', '面板显示：'),

    # ---- Standalone number entities (after 碎片/备份 variants handled) ----
    ('0429在说：', '0429的信号传来：'),
    ('0428在说：', '0428的信号传来：'),
    ('0415在说：', '0415的信号传来：'),

    # ---- Semi-mechanical narrative patterns (person speaking) ----
    ('赵大嘴的眼睛在说：', '赵大嘴的眼睛里写着：'),
    ('维护派的队长，在说：', '维护派的队长说：'),
    ('维护派的队长在说：', '维护派的队长说：'),
    ('指挥官在说：', '指挥官说：'),
    ('一个男人，在说：', '一个男人说：'),
]

DEGEN_RE = re.compile(r'(在说|在发光|在跳动|在感知)：')

total_replacements = 0
chapter_stats = {}
remaining_degen = {}
remaining_contexts = {}

for i in range(551, 751):
    if i in DEFERRED:
        continue
    fname = f'chapter-{i:03d}-polished.md'
    fpath = os.path.join(V5_DIR, fname)
    if not os.path.exists(fpath):
        continue
    raw = open(fpath, 'rb').read()
    has_bom = raw[:3] == b'\xef\xbb\xbf'
    txt = raw.decode('utf-8-sig' if has_bom else 'utf-8')

    chapter_replacements = 0
    for old, new in REPLACEMENTS:
        count = txt.count(old)
        if count > 0:
            txt = txt.replace(old, new)
            chapter_replacements += count

    if chapter_replacements > 0:
        total_replacements += chapter_replacements
        chapter_stats[i] = chapter_replacements

        # Write back (UTF-8 no BOM)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(txt)

    # Check remaining degeneration with context
    remaining_matches = list(DEGEN_RE.finditer(txt))
    if remaining_matches:
        remaining_degen[i] = len(remaining_matches)
        ctxs = []
        for m in remaining_matches:
            start = max(0, m.start() - 15)
            end = min(len(txt), m.end() + 25)
            ctx = txt[start:end].replace('\n', ' ')
            ctxs.append(f"...{ctx}...")
        remaining_contexts[i] = ctxs

output = {
    'total_replacements': total_replacements,
    'chapters_modified': len(chapter_stats),
    'chapter_stats': chapter_stats,
    'remaining_degen_total': sum(remaining_degen.values()),
    'remaining_degen_chapters': len(remaining_degen),
    'remaining_degen': remaining_degen,
    'remaining_contexts': remaining_contexts,
}

with open('D:/work/yewenxuan_story/degen_replacement_report.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Replacements: {total_replacements}, Chapters modified: {len(chapter_stats)}, Remaining: {sum(remaining_degen.values())} in {len(remaining_degen)} chapters")
