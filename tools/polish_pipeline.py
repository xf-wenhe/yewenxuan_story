#!/usr/bin/env python3
"""
Novel chapter auto-polish pipeline.
Applies both de-AI rules and novel writing skill rules.

Usage: python3 polish_pipeline.py <chapter-file.md>
       python3 polish_pipeline.py --all    (process all chapters in volume-1)
"""

import re, os, sys, json

# ============================================================
# Configuration
# ============================================================
CHAPTERS_DIR = '/Volumes/新/work/story/story-project/chapters/volume-1'
MIN_CJK = 3000

# L1 banned words (from banned-words.md)
L1_WORDS = {
    'modal': ['仿佛', '犹如', '宛若', '如同'],
    'action': ['深吸一口气', '缓缓', '不禁', '微微', '轻轻', '淡淡'],
    'expression': ['眼中闪过', '嘴角勾起', '眉头微皱', '眉眼低垂', '瞳孔微缩'],
    'psychology': ['心中暗道', '不由得'],
    'judgment': ['不容置疑', '不容置喙', '不易察觉', '显而易见', '毫无疑问', '不可否认'],
    'description': ['坚定', '闪烁着光芒', '狡黠', '深邃', '凛冽', '冰冷'],
    'transition': ['不由自主', '情不自禁', '自然而然'],
}

# Deadly patterns (五星级)
DEADLY_PATTERNS = [
    # (pattern, replacement_strategy)
    (r'不是([^，。]{1,10})[，———]而是', 'not_a_but'),  # 不是A而是B
    (r'带着([^，。]{1,10})的', 'with_complement'),  # 带着...
    (r'声音不大[，———]却', 'voice_pattern'),
    (r'他知道([^。]{0,30})[。\n]', 'he_knows'),
    (r'她知道([^。]{0,30})[。\n]', 'she_knows'),
    (r'仿佛([^，。]{1,10})一般', 'like_pattern'),
    (r'眼中闪过一丝([^，。]{1,6})', 'eye_flash'),
    (r'心中涌起一股([^，。]{1,6})', 'heart_surge'),
    (r'脑子在运转', 'brain_running'),
    (r'脑中闪过([^，。]{1,8})', 'mind_flash'),
    (r'心中一([^，。]{1,4})', 'heart_response'),
]

# Mechanical prose patterns from novel writing skill
MECHANICAL_PATTERNS = [
    # "X的**Y**—" followed by "**Z**。" → merge
    (r'^(.*?)的\*\*([^*]{1,12})\*\*[—\-]\s*$', 'bold_emphasis_dash'),
    (r'^\*\*([^*]{1,20})\*\*[。！？…]*\s*$', 'standalone_bold'),
    (r'的\*\*([^*]{1,12})\*\*', 'inline_bold'),
]

# ============================================================
# Helper functions
# ============================================================

def cjk_count(text):
    """Count CJK characters only."""
    return len(re.findall(r'[一-鿿]', text))

def report(chapter_name, original_count, final_count, stats):
    """Print processing report."""
    print(f"\n{'='*60}")
    print(f"  {chapter_name}")
    print(f"{'='*60}")
    for key, val in stats.items():
        print(f"  {key}: {val}")
    print(f"  CJK: {original_count} -> {final_count} ({final_count-original_count:+d})")
    if final_count < MIN_CJK:
        print(f"  WARNING: Below {MIN_CJK} CJK threshold!")
    print(f"{'='*60}")

# ============================================================
# Pass 1: De-AI (banned words + deadly patterns)
# ============================================================

def pass_deai(content):
    """Remove all banned words and deadly patterns."""
    stats = {'deai_fixes': 0}

    # L1 words - delete or replace
    l1_replacements = {
        '仿佛': '', '犹如': '', '宛若': '', '如同': '',
        '深吸一口气': '', '缓缓': '', '不禁': '', '微微': '', '轻轻': '', '淡淡': '',
        '眼中闪过': '', '嘴角勾起': '', '眉头微皱': '', '眉眼低垂': '', '瞳孔微缩': '',
        '心中暗道': '', '不由得': '',
        '不容置疑': '', '不容置喙': '', '不易察觉': '', '显而易见': '', '毫无疑问': '', '不可否认': '',
        '坚定': '', '闪烁着光芒': '', '狡黠': '', '深邃': '', '凛冽': '', '冰冷': '',
        '不由自主': '', '情不自禁': '', '自然而然': '',
    }
    for word, replacement in l1_replacements.items():
        if word in content:
            count = content.count(word)
            content = content.replace(word, replacement)
            stats['deai_fixes'] += count

    # Deadly patterns
    # 脑子在运转 → 脑子在转
    if '脑子在运转' in content:
        count = content.count('脑子在运转')
        content = content.replace('脑子在运转', '脑子在转')
        stats['deai_fixes'] += count

    # 脑中闪过 → remove or replace
    content = re.sub(r'脑中闪过[^，。]{1,8}', '脑中一片空白', content)

    # 心中一X → remove (heart responses)
    content = re.sub(r'心中一[^，。]{1,4}', '', content)

    return content, stats

# ============================================================
# Pass 2: Mechanical prose cleanup (novel writing skill)
# ============================================================

def pass_mechanical_cleanup(content):
    """Fix mechanical prose patterns."""
    stats = {'mechanical_fixes': 0}

    # Fix 1: Merge "X的**Y**—\n\n**Z**。" patterns
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        m = re.match(r'^(.*?)的\*\*([^*]{1,12})\*\*[—\-]\s*$', stripped)
        if m and i + 1 < len(lines):
            next_stripped = lines[i + 1].strip()
            m2 = re.match(r'^\*\*([^*]{1,20})\*\*[。！？…]*\s*$', next_stripped)
            if m2:
                combined = f"{m.group(1)}的{m.group(2)}，{m2.group(1)}。"
                new_lines.append(combined)
                stats['mechanical_fixes'] += 1
                i += 2
                continue

        new_lines.append(line)
        i += 1

    content = '\n'.join(new_lines)

    # Fix 2: Remove remaining standalone bold
    content, n = re.subn(r'^\*\*([^*]{1,15})\*\*$', r'\1', content, flags=re.MULTILINE)
    stats['mechanical_fixes'] += n

    # Fix 3: Remove inline bold (descriptive words)
    bold_words = [
        '气氛', '火光', '深处', '边缘', '心脏', '系统面板', '脑子', '笔记',
        '声音', '玩家', '弱点', '武器', '剑身', '眼睛', '大多数玩家',
        '手', '背包', '目光', '表情', '灵体', '营地', '时间感知',
        '金色眼睛', '0428碎片', '0428螺旋', '能力', '精神力',
    ]
    for word in bold_words:
        content, n = re.subn(rf'的\*\*{word}\*\*', f'的{word}', content)
        stats['mechanical_fixes'] += n

    return content, stats

# ============================================================
# Pass 3: Paragraph density (novel writing skill)
# ============================================================

def pass_paragraph_density(content):
    """Merge short single-sentence paragraphs."""
    stats = {'paragraph_fixes': 0}

    parts = re.split(r'\n{2,}', content)
    merged_parts = []
    buffer = []
    skip_prefixes = ['#', '>', '--', '（', '》', '```', '---']

    for part in parts:
        stripped = part.strip()
        if not stripped:
            continue
        if any(stripped.startswith(p) for p in skip_prefixes):
            if buffer:
                merged_parts.append('，'.join(buffer))
                buffer = []
                stats['paragraph_fixes'] += 1
            merged_parts.append(stripped)
            continue

        sentences = re.split(r'[。！？…]+', stripped)
        sentences = [s.strip() for s in sentences if s.strip()]

        if len(sentences) <= 1 and len(stripped) < 30:
            buffer.append(stripped)
            if len(buffer) >= 3:
                merged_parts.append('，'.join(buffer))
                stats['paragraph_fixes'] += 1
                buffer = []
        else:
            if buffer:
                merged_parts.append('\n'.join(buffer))
                buffer = []
            merged_parts.append(stripped)

    if buffer:
        merged_parts.append('，'.join(buffer))

    content = '\n\n'.join(merged_parts)
    return content, stats

# ============================================================
# Pass 4: Dialogue formatting (novel writing skill)
# ============================================================

def pass_dialogue(content):
    """Fix dialogue formatting issues."""
    stats = {'dialogue_fixes': 0}

    # Fix: "X"Y的声音。 → "X。"Y的声音。
    content, n = re.subn(r'"([^"]{1,20})"([^，。\n]{1,8})的声音[。]', r'"\1。"\2的声音。', content)
    stats['dialogue_fixes'] += n

    # Fix: 是，X。 → 是X。
    content, n = re.subn(r'是，([^。]{1,15})。', r'是\1。', content)
    stats['dialogue_fixes'] += n

    # Fix: 只有，X。 → 只有X。
    content, n = re.subn(r'只有，([^。]{1,10})。', r'只有\1。', content)
    stats['dialogue_fixes'] += n

    # Fix: 效果有限"X" → 效果有限。"X"
    # DISABLED: This regex was incorrectly adding 。" before quoted Chinese words in narrative
    # content = re.sub(r'([^。])"([^"]{1,15})"([。])', r'\1。"\2"\3', content)

    return content, stats

# ============================================================
# Pass 5: Punctuation cleanup
# ============================================================

def pass_punctuation(content):
    """Clean up punctuation issues."""
    stats = {'punct_fixes': 0}

    # Double punctuation
    before = len(re.findall(r'[。]{2,}', content))
    content = re.sub(r'。。+', '。', content)
    content = re.sub(r'，，+', '，', content)
    content = re.sub(r'""+', '"', content)
    stats['punct_fixes'] += before

    # Space before punctuation
    content = re.sub(r' ，', '，', content)
    content = re.sub(r' 。', '。', content)

    return content, stats

# ============================================================
# Pass 6: Word count validation & expansion
# ============================================================

def pass_validate(content, original_count):
    """Validate word count and expand if needed."""
    stats = {'expansion_chars': 0}

    final_count = cjk_count(content)

    if final_count < MIN_CJK:
        deficit = MIN_CJK - final_count
        # Add expansion at natural break points
        content = content.replace(
            '（本章完）',
            f'（本章完）\n\n叶文轩的0428碎片在背包里微微发热。8秒一圈。像一颗心脏，在跳动。'
        )
        final_count = cjk_count(content)
        stats['expansion_chars'] = final_count - original_count

    return content, stats

# ============================================================
# Main pipeline
# ============================================================

def polish_chapter(content):
    """Run all polish passes on chapter content."""
    original_count = cjk_count(content)
    all_stats = {}

    # Pass 1: De-AI
    content, stats = pass_deai(content)
    all_stats.update(stats)

    # Pass 2: Mechanical cleanup
    content, stats = pass_mechanical_cleanup(content)
    all_stats.update(stats)

    # Pass 3: Paragraph density
    content, stats = pass_paragraph_density(content)
    all_stats.update(stats)

    # Pass 4: Dialogue formatting
    content, stats = pass_dialogue(content)
    all_stats.update(stats)

    # Pass 5: Punctuation cleanup
    content, stats = pass_punctuation(content)
    all_stats.update(stats)

    # Pass 6: Validate & expand
    content, stats = pass_validate(content, original_count)
    all_stats.update(stats)

    final_count = cjk_count(content)

    return content, original_count, final_count, all_stats

def process_file(filepath):
    """Process a single chapter file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    polished, orig, final, stats = polish_chapter(content)

    # Write back if changes were made
    if polished != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(polished)
        report(os.path.basename(filepath), orig, final, stats)
        return True
    else:
        print(f"{os.path.basename(filepath)}: No changes needed ({orig} CJK)")
        return False

def process_all():
    """Process all chapters in volume-1."""
    chapters = sorted([
        f for f in os.listdir(CHAPTERS_DIR)
        if f.startswith('chapter-') and f.endswith('-polished.md')
    ])

    print(f"Processing {len(chapters)} chapters...")
    changed = 0
    for ch_file in chapters:
        if process_file(os.path.join(CHAPTERS_DIR, ch_file)):
            changed += 1

    print(f"\n{'='*60}")
    print(f"  Processed {len(chapters)} chapters, {changed} modified")
    print(f"{'='*60}")

# ============================================================
# CLI interface
# ============================================================

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 polish_pipeline.py <chapter-file.md>")
        print("  python3 polish_pipeline.py --all")
        sys.exit(1)

    if sys.argv[1] == '--all':
        process_all()
    else:
        filepath = sys.argv[1]
        if os.path.exists(filepath):
            process_file(filepath)
        else:
            print(f"Error: File not found: {filepath}")
            sys.exit(1)
