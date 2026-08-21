#!/usr/bin/env python
"""
Dry-run all blocking fix patterns against the 201 remaining files.
Reports changes without writing.

Usage:
  python tools/dry_run_remaining.py          # dry-run all
  python tools/dry_run_remaining.py --apply  # apply all fixes
  python tools/dry_run_remaining.py --skip-manual  # skip trailer/voice files
"""
import re
import os
import sys
import json
import subprocess

ROOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# ── Pattern 1: not-is-comparison (不是A，是B。→ B。) ──
not_is_re = re.compile(
    r'不是([一-鿿\w\s]+?)(?<!。)(?<![，、；：！？])是([一-鿿，]+?)(?=[。])(?=[\s\S]*?(?=[\n\*「>]|$))'
)

# ── Pattern 2: reverse-not-is (是A，不是B。→ A。) ──
reverse_re = re.compile(
    r'是([一-鿿，，\w]+?),\s*不是([一-鿿，，\w]+?)(?=[。])'
)

# ── Pattern 3: negation-parade (没有A，没有B。→ 没有A。) ──
negation_re = re.compile(
    r'没有([一-鿿\w\s、]+?)(?:，没有[一-鿿\w\s、]+?)+(。|！|？|，)'
)
negation_short_re = re.compile(
    r'没([一-鿿\w\s、]+?)(?:，没[一-鿿\w\s、]+?)+(。|！|？|，)'
)

# ── Pattern 4: ASCII -- standalone line ──
ascii_emdash_line_re = re.compile(r'^\s*--\s*[\r\n]*', re.MULTILINE)

# ── Pattern 5: full-width em-dash —— ──
fullwidth_emdash_re = re.compile(r'[—⸺]{2,}')


def replace_not_is(m):
    part = m.group(2).strip()
    return part + '。' if part else m.group(0)

def replace_reverse(m):
    part = m.group(1).strip()
    return part + '。' if part else m.group(0)

def replace_negation(m):
    part = m.group(1).strip()
    end = m.group(2)
    return ('没有' + part + end) if part else m.group(0)

def replace_emdash_line(text):
    return ascii_emdash_line_re.sub('', text)

def replace_emdash_text(text):
    def repl(m):
        matched = m.group(0)
        if matched.startswith('>') or matched.startswith('「'):
            return matched
        before = text[max(0, m.start()-3):m.start()]
        after = text[m.end():min(len(text), m.end()+3)]
        if '「' in before or '」' in after:
            return matched
        if before and ('一' <= before[-1] <= '鿿' or before[-1] in '"“”『』'):
            return '，'
        return '。'
    return fullwidth_emdash_re.sub(repl, text)


def process_file(filepath, dry_run=True):
    """Apply all fixes. Return (changed, old_cjk, new_cjk, details)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    modified = original

    before_count = {
        'not-is': len(not_is_re.findall(modified)),
        'reverse-not-is': len(reverse_re.findall(modified)),
        'negation': len(negation_re.findall(modified)) + len(negation_short_re.findall(modified)),
        'emdash-line': len(ascii_emdash_line_re.findall(modified)),
        'emdash-text': len(fullwidth_emdash_re.findall(modified)),
    }

    modified = replace_emdash_line(modified)
    modified = replace_emdash_text(modified)
    modified = not_is_re.sub(replace_not_is, modified)
    modified = reverse_re.sub(replace_reverse, modified)
    modified = negation_re.sub(replace_negation, modified)
    modified = negation_short_re.sub(replace_negation, modified)

    if modified == original:
        return False, 0, 0, {}

    old_cjk = sum(1 for c in original if '一' <= c <= '鿿')
    new_cjk = sum(1 for c in modified if '一' <= c <= '鿿')

    if not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified)

    return True, old_cjk, new_cjk, before_count


def get_remaining_files():
    """Get 201 files with blocking findings but not yet modified."""
    findings = json.load(open(os.path.join(ROOT_DIR, '_blocking_findings.json'), encoding='utf-8'))
    findings_files = set()
    for f in findings:
        fp = f.get('file', '')
        if fp:
            rel = os.path.relpath(fp, ROOT_DIR).replace(os.sep, '/')
            findings_files.add(rel)

    result = subprocess.run(['git', 'diff', '--name-only'], capture_output=True, text=True, cwd=ROOT_DIR)
    modified = set(result.stdout.strip().split('\n'))
    remaining = sorted(findings_files - modified)
    return remaining


def main():
    dry_run = '--apply' not in sys.argv
    skip_manual = '--skip-manual' in sys.argv

    manual_files = set()
    if not skip_manual:
        try:
            other = json.load(open(os.path.join(ROOT_DIR, '_other_blocking.json'), encoding='utf-8'))
            for e in other:
                fp = e.get('file', '')
                if fp:
                    manual_files.add(os.path.relpath(fp, ROOT_DIR).replace(os.sep, '/'))
        except:
            pass

    files = get_remaining_files()
    if skip_manual:
        files = [f for f in files if f not in manual_files]

    mode = "DRY-RUN (no files changed)" if dry_run else "APPLY (files will be modified)"
    print(f"=== Blocking Fix Batch: {mode} ===")
    print(f"Files to process: {len(files)}")
    if manual_files:
        print(f"Manual-review files included: {len(manual_files)}")
    print()

    fixed = 0
    unchanged = 0
    cjk_delta_total = 0
    errors = 0

    for i, rel_path in enumerate(files, 1):
        filepath = os.path.join(ROOT_DIR, rel_path)
        if not os.path.exists(filepath):
            print(f"  [{i}/{len(files)}] SKIP (not found): {rel_path}")
            errors += 1
            continue

        try:
            changed, old_cjk, new_cjk, before = process_file(filepath, dry_run)
            if changed:
                fixed += 1
                delta = new_cjk - old_cjk
                cjk_delta_total += delta
                status = "DRY" if dry_run else "FIXED"
                pattern_info = ', '.join(f"{k}:{v}" for k, v in before.items() if v > 0)
                print(f"  [{i}/{len(files)}] {status}: {os.path.basename(rel_path)} cjk:{old_cjk}->{new_cjk}({delta:+d}) [{pattern_info}]")
            else:
                unchanged += 1
        except Exception as e:
            print(f"  [{i}/{len(files)}] ERROR: {rel_path} — {e}")
            errors += 1

    print()
    print("=== Summary ===")
    print(f"  Files modified:  {fixed}")
    print(f"  Files unchanged: {unchanged}")
    print(f"  Errors:          {errors}")
    print(f"  CJK delta total: {cjk_delta_total:+d}")

    if dry_run:
        print("\n  No files were changed. Re-run with --apply to write changes.")
        print("  Use --skip-manual to exclude trailer-ending/voice-contrast files.")

    # Show manual files that were skipped
    if skip_manual:
        remaining_manual = [f for f in files if f in manual_files]
        if remaining_manual:
            print(f"\n  Skipped {len(remaining_manual)} manual-review files:")
            for f in remaining_manual:
                print(f"    {f}")


if __name__ == '__main__':
    main()