#!/usr/bin/env python
"""
Batch fix blocking AI-pattern findings.
Fixes: not-is-comparison, reverse-not-is, negation-parade, em-dash
Strategy: delete negation clause, keep affirmative (per story-deslop skill Gate B)
"""
import re
import os
import sys
import subprocess
import json

TOOL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.claude', 'skills', 'story-deslop', 'scripts')
CHECK_TOOL = os.path.join(TOOL_DIR, 'check-ai-patterns.js')
ROOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

NOT_IS_BLOCKING = [
    'not-is-comparison', 'reverse-not-is', 'negation-parade', 'em-dash',
    'trailer-ending', 'trailer-summary', 'voice-contrast'
]

not_is_re = re.compile(
    r'不是([一-鿿\w\s]+?)(?<!。)(?<![，、；：！？])是([一-鿿，]+?)(?=[。])(?=[\s\S]*?(?=[\n\*「>]|$))'
)

reverse_re = re.compile(
    r'是([一-鿿，，\w]+?),\s*不是([一-鿿，，\w]+?)(?=[。])'
)

negation_re = re.compile(
    r'没有([一-鿿，，\w\s]+?),\s*没有([一-鿿，，\w\s]+?)(?=[。])'
)

# Em-dash pattern: two or more em-dashes or full-width dashes
emdash_re = re.compile(r'[—⸺]{2,}')

def replace_not_is(m):
    part_after = m.group(2).strip()
    if not part_after:
        return m.group(0)
    return part_after + '。'

def replace_reverse(m):
    part_before = m.group(1).strip()
    if not part_before:
        return m.group(0)
    return part_before + '。'

def replace_negation(m):
    part_first = m.group(1).strip()
    if not part_first:
        return m.group(0)
    return '没有' + part_first + '。'

def replace_emdash(text):
    def repl(m):
        ch = m.group(0)[0]
        # Keep blockquote markers
        if ch in '>「>' or (len(m.group(0)) == 2 and ch == '*'):
            return m.group(0)
        context = text[max(0, m.start()-5):m.start()]
        nxt = text[m.end():min(len(text), m.end()+5)]
        if '「」' in text[max(0, m.start()-3):m.end()+3]:
            return m.group(0)
        if re.search(r'[一-鿿说"', context):
            return '，'
        return '。'
    return emdash_re.sub(repl, text)

def scan_blocking(filepath):
    try:
        r = subprocess.run(
            ['node', CHECK_TOOL, '--check', '--fail-on=blocking', filepath],
            capture_output=True, text=True, timeout=30
        )
        output = r.stdout + r.stderr
        findings = []
        for line in output.split('\n'):
            for pat in NOT_IS_BLOCKING:
                if pat in line:
                    findings.append(pat)
        return findings
    except Exception:
        return []

def count_cjk(text):
    return sum(1 for c in text if '一' <= c <= '鿿')

def process_file(filepath, dry_run=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    modified = original

    # Pass 1: not-is-comparison
    modified = not_is_re.sub(replace_not_is, modified)
    # Pass 2: reverse-not-is
    modified = reverse_re.sub(replace_reverse, modified)
    # Pass 3: negation-parade
    modified = negation_re.sub(replace_negation, modified)
    # Pass 4: em-dash (text-level)
    modified = replace_emdash(modified)

    if modified == original:
        return False, 0, 0, 0

    old_count = count_cjk(original)
    new_count = count_cjk(modified)
    delta = new_count - old_count

    if not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified)

    return True, old_count, new_count, delta

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--dry-run':
        dry_run = True
        print("=== DRY RUN MODE ===")
    else:
        dry_run = False
        print("=== APPLY MODE ===")

    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_blocking_files.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        files = json.load(f)

    if len(sys.argv) > 2 and sys.argv[2].isdigit():
        files = files[int(sys.argv[2]):int(sys.argv[2])+int(sys.argv[3]) if len(sys.argv) > 3 else int(sys.argv[2])+10]

    total = len(files)
    fixed = 0
    unchanged = 0
    cjk_total_delta = 0

    for i, entry in enumerate(files):
        filepath = entry['file']
        reason = entry.get('reason', 'unknown')

        if not os.path.exists(filepath):
            print(f"  [{i+1}/{total}] SKIP (not found): {os.path.basename(filepath)}")
            continue

        changes, old_cjk, new_cjk, delta = process_file(filepath, dry_run)

        if changes:
            fixed += 1
            cjk_total_delta += delta
            status = "DRY" if dry_run else "FIXED"
            print(f"  [{i+1}/{total}] {status}: {os.path.basename(filepath)} ({reason}) cjk:{old_cjk}->{new_cjk} delta:{delta:+d}")
        else:
            unchanged += 1
            if i < 5:
                print(f"  [{i+1}/{total}] no-change: {os.path.basename(filepath)} ({reason})")

        if i < 4:
            print(f"    regex patterns:")
            print(f"      not_is_re: {not_is_re.pattern[:80]}...")
            print(f"      reverse_re: {reverse_re.pattern[:80]}...")
            print(f"      negation_re: {negation_re.pattern[:80]}...")

    print(f"\n=== Summary ===")
    print(f"  Total files: {total}")
    print(f"  Files modified: {fixed}")
    print(f"  Files unchanged: {unchanged}")
    print(f"  Total CJK delta: {cjk_total_delta:+d}")

    if dry_run:
        print("\n  DRY RUN — no files were changed. Re-run without --dry-run to apply.")

if __name__ == '__main__':
    main()