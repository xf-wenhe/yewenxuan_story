import re, os, json

V5_DIR = 'D:/work/yewenxuan_story/chapters/volume-5'
DEFERRED = set(range(631, 641)) | {659}

DEGEN_RE = re.compile(r'(在说|在发光|在跳动|在感知)：')

# Known system entity patterns, longest first
SYSTEM_ENTITIES = [
    '0429碎片', '0428碎片', '0415碎片',
    '0429的备份', '0428的备份', '0429备份', '0428备份',
    '记忆光点', '光体', '光球', '光点',
    '备份', '碎片',
    '桥梁', '面板',
    '0429', '0428', '0415',
]

# Known narrative entities (person/thing speaking — NOT mechanical)
NARRATIVE_ENTITIES = [
    '赵大嘴', '叶文轩', '沈知秋', '陈小鱼', '朵朵', '守门人',
    '画面', '光', '他', '她', '它',
]

results = {}
total = 0
chapters_with_degen = set()
system_total = 0
narrative_total = 0
unknown_total = 0

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

    for m in DEGEN_RE.finditer(txt):
        total += 1
        chapters_with_degen.add(i)
        pattern = m.group(1)

        # Get 20 chars before the match
        start = max(0, m.start() - 20)
        prefix = txt[start:m.start()]

        # Try to identify system entity
        entity = None
        category = 'UNKNOWN'
        for se in SYSTEM_ENTITIES:
            if prefix.endswith(se):
                entity = se
                category = 'SYSTEM'
                system_total += 1
                break

        # Try narrative entities
        if entity is None:
            for ne in NARRATIVE_ENTITIES:
                if prefix.endswith(ne):
                    entity = ne
                    category = 'NARRATIVE'
                    narrative_total += 1
                    break

        # Fallback: last 8 chars of prefix
        if entity is None:
            entity = prefix[-8:] if len(prefix) >= 8 else prefix
            unknown_total += 1

        # Get context: 15 chars before and 25 chars after
        ctx_start = max(0, m.start() - 15)
        ctx_end = min(len(txt), m.end() + 25)
        context = txt[ctx_start:ctx_end].replace('\n', ' ')

        key = f"{entity}|{pattern}|{category}"
        if key not in results:
            results[key] = {'count': 0, 'contexts': [], 'chapters': set()}
        results[key]['count'] += 1
        results[key]['chapters'].add(i)
        if len(results[key]['contexts']) < 2:
            results[key]['contexts'].append(f"ch{i}: {context}")

# Convert sets to sorted lists for JSON
for key in results:
    results[key]['chapters'] = sorted(results[key]['chapters'])

# Sort by count descending
sorted_results = dict(sorted(results.items(), key=lambda x: -x[1]['count']))

output = {
    'total_instances': total,
    'system_total': system_total,
    'narrative_total': narrative_total,
    'unknown_total': unknown_total,
    'chapters_with_degen': sorted(chapters_with_degen),
    'num_chapters': len(chapters_with_degen),
    'entity_pattern_counts': sorted_results,
}

with open('D:/work/yewenxuan_story/degen_entities.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Total: {total}, System: {system_total}, Narrative: {narrative_total}, Unknown: {unknown_total}, Chapters: {len(chapters_with_degen)}, Types: {len(sorted_results)}")
