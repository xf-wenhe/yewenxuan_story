#!/usr/bin/env python
"""
Batch fix blocking AI-pattern findings (em-dash + negation-parade).

Reads _fixable_blocking.json (379 files with em-dash/negation findings).
Fixes:
  1. -- (ASCII double-hyphen standalone line) → delete entire line
  2. —— (full-width em-dash in text) → context-aware replacement:
     - after Chinese char / quote / 说 → replace with ，
     - otherwise → replace with 。
     - preserve blockquote markers (>, 「)
  3. negation-parade: "没有X，没有Y，..." → keep only first "没有X"

Usage:
  python tools/fix_blocking_batch.py --dry-run   # preview changes
  python tools/fix_blocking_batch.py              # apply changes
  python tools/fix_blocking_batch.py --start 0 --count 50  # process 50 files
"""
import re
import os
import sys
import json

ROOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
INPUT_FILE = os.path.join(ROOT_DIR, '_fixable_blocking.json')

# 1) ASCII -- on its own line (standalone horizontal rule)
ascii_emdash_line_re = re.compile(r'^\s*--\s*[\r\n]*', re.MULTILINE)

# 2) Full-width em-dash —— in text (context-aware)
fullwidth_emdash_re = re.compile(r'[—⸺]{2,}')

# 3) Negation parade: "没有X，没有Y，没有Z。" or "没有X，没有Y，但..." → keep only first "没有X"
negation_re = re.compile(
    r'没有([一-鿿\w\s、]+?)(?:，没有[一-鿿\w\s、]+?)+(。|！|？|，)'
)

# Also handle "没X，没Y" pattern (short form, without 有)
negation_short_re = re.compile(
    r'没([一-鿿\w\s、]+?)(?:，没[一-鿿\w\s、]+?)+(。|！|？|，)'
)


def replace_ascii_emdash(text):
    """Delete standalone -- lines entirely."""
    return ascii_emdash_line_re.sub('', text)


def replace_fullwidth_emdash(text):
    """Context-aware replacement of —— in text."""
    def repl(m):
        matched = m.group(0)
        # Skip blockquote markers
        if matched.startswith('>') or matched.startswith('「'):
            return matched
        # Check if surrounded by 「」
        before = text[max(0, m.start()-3):m.start()]
        after = text[m.end():min(len(text), m.end()+3)]
        if '「' in before or '」' in after:
            return matched
        # If preceded by CJK char / quote → replace with comma
        if before and ('一' <= before[-1] <= '鿿' or before[-1] in '“”『』'):
            return '，'
        # Otherwise → replace with 。
        return '。'
    return fullwidth_emdash_re.sub(repl, text)


def replace_negation(m):
    """Keep only the first negation, drop the rest."""
    part_first = m.group(1).strip()
    end = m.group(2)
    if not part_first:
        return m.group(0)
    return '没有' + part_first + end


def count_cjk(text):
    return sum(1 for c in text if '一' <= c <= '鿿')


def process_file(filepath, dry_run=False):
    """Apply all fixes. Return (changed, old_cjk, new_cjk, details)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    modified = original

    # Step 1: Delete standalone -- lines
    modified = replace_ascii_emdash(modified)

    # Step 2: Full-width em-dash in text
    modified = replace_fullwidth_emdash(modified)

    # Step 3: Negation parade
    modified = negation_re.sub(replace_negation, modified)

    # Step 4: Short form negation (没X，没Y)
    modified = negation_short_re.sub(replace_negation, modified)

    if modified == original:
        return False, 0, 0, ''

    old_cjk = count_cjk(original)
    new_cjk = count_cjk(modified)
    delta = new_cjk - old_cjk

    if not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified)

    return True, old_cjk, new_cjk, delta


def show_preview(original, modified, max_chars=600):
    """Show a brief diff preview."""
    lines_o = original.split('\n')
    lines_m = modified.split('\n')
    changes = []
    for i in range(min(len(lines_o), len(lines_m))):
        if lines_o[i] != lines_m[i]:
            changes.append((i+1, lines_o[i], lines_m[i]))
    if len(lines_o) != len(lines_m):
        changes.append((min(len(lines_o), len(lines_m))+1,
                        '(line count changed)', ''))
    return changes


def main():
    dry_run = '--dry-run' in sys.argv
    print(f"=== {'DRY RUN' if dry_run else 'APPLY'} MODE ===")

    # Load file list
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        files = json.load(f)
    print(f"Loaded {len(files)} files from _fixable_blocking.json")

    # Slicing support
    start = 0
    count = len(files)
    for i, arg in enumerate(sys.argv):
        if arg == '--start' and i+1 < len(sys.argv) and sys.argv[i+1].isdigit():
            start = int(sys.argv[i+1])
        if arg == '--count' and i+1 < len(sys.argv) and sys.argv[i+1].isdigit():
            count = int(sys.argv[i+1])

    files = files[start:start+count]
    print(f"Processing files [{start}:{start+count}] ({len(files)} files)\n")

    total = len(files)
    fixed = 0
    unchanged = 0
    errors = 0
    cjk_delta = 0
    preview_count = 0

    for i, filepath in enumerate(files):
        if isinstance(filepath, dict):
            filepath = filepath.get('file', filepath.get('path', ''))

        if not os.path.exists(filepath):
            print(f"  [{i+1}/{total}] SKIP (not found): {os.path.basename(filepath)}")
            errors += 1
            continue

        changed, old_cjk, new_cjk, delta = process_file(filepath, dry_run)

        if changed:
            fixed += 1
            cjk_delta += delta
            status = "DRY" if dry_run else "FIXED"
            print(f"  [{i+1}/{total}] {status}: {os.path.basename(filepath)} cjk:{old_cjk}->{new_cjk} ({delta:+d})")

            # Show preview for first 5 changed files
            if preview_count < 5 and dry_run:
                with open(filepath, 'r', encoding='utf-8') as f:
                    orig = f.read()
                # Re-process to get modified
                mod = orig
                mod = replace_ascii_emdash(mod)
                mod = replace_fullwidth_emdash(mod)
                mod = negation_re.sub(replace_negation, mod)
                mod = negation_short_re.sub(replace_negation, mod)
                changes = show_preview(orig, mod)
                for lineno, old_line, new_line in changes[:5]:
                    print(f"    L{lineno}:")
                    print(f"      - {old_line[:100]}")
                    print(f"      + {new_line[:100]}")
                preview_count += 1
        else:
            unchanged += 1
            if i < 5:
                print(f"  [{i+1}/{total}] no-change: {os.path.basename(filepath)}")

    print(f"\n=== Summary ===")
    print(f"  Total files: {total}")
    print(f"  Files modified: {fixed}")
    print(f"  Files unchanged: {unchanged}")
    print(f"  Errors: {errors}")
    print(f"  Total CJK delta: {cjk_delta:+d}")

    if dry_run:
        print("\n  DRY RUN — no files were changed.")
        print("  Re-run without --dry-run to apply.")


if __name__ == '__main__':
    main()