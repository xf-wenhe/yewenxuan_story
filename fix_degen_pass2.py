import re, os, json

V5_DIR = 'D:/work/yewenxuan_story/chapters/volume-5'
DEFERRED = set(range(631, 641)) | {659}

# Second pass: semi-mechanical narrative patterns
# These are person-speaking, personified-intuition, simile, broken-text cases
REPLACEMENTS = [
    # 沈知秋 speaking (spurious comma cases first, then remaining)
    ('沈知秋在说：，', '沈知秋说：'),
    ('沈知秋在说：', '沈知秋说：'),
    ('沈知秋的嗓音在说：', '沈知秋的嗓音传来：'),

    # 赵大嘴 speaking
    ('赵大嘴在说：', '赵大嘴说：'),

    # Other persons speaking
    ('一个小女孩在说：', '一个小女孩说：'),
    ('陈小鱼的意识在说：', '陈小鱼的意识传来声音：'),

    # 0429 personified as 它/他 (keeps personification, removes degeneration)
    ('它在说：', '它传来信号：'),
    ('他在说：', '他传来信号：'),

    # 直觉/核心 personified (generic catches 他的/赵大嘴的 prefixes too)
    ('直觉在说：', '直觉告诉他：'),
    ('他的核心在说：', '他的核心在提示：'),

    # Broken text / system announcement
    ('现在说：', '现在传来信号：'),

    # Personified echo
    ('回声在说：', '回声传来：'),

    # Progress bar
    ('记忆传输的进度在跳动：', '记忆传输的进度显示：'),

    # System entity separated from 在说 by other text
    ('光体在脉动，在说：', '光体在脉动，传来信号：'),
    ('0429碎片在他的体内振动，在说：', '0429碎片在他的体内振动，传来信号：'),

    # Simile false positives — rephrase to avoid regex match
    ('似乎在说：', '似乎在低语：'),
    ('像在说：', '像在暗示：'),
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

with open('D:/work/yewenxuan_story/degen_replacement_report2.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Replacements: {total_replacements}, Chapters modified: {len(chapter_stats)}, Remaining: {sum(remaining_degen.values())} in {len(remaining_degen)} chapters")
