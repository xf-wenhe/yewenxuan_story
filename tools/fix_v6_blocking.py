#!/usr/bin/env python
"""
Batch fix blocking AI-pattern findings for V6 chapters only.
Reads _v6_blocking_files.json.

Safe mechanical fixes only:
  1. not-is-comparison:  不是X，是Y → 是Y  (delete negation, keep affirmative verbatim)
  2. reverse-not-is:     是X，不是Y → 是X  (delete negation tail)
  3. negation-parade:    没有X，没有Y → 没有X
  4. em-dash line:       -- (standalone) → delete
  5. em-dash text:       —— → ， or 。 (context-aware)

Rules:
  - NEVER add extra punctuation — preserve original ending
  - Skip content inside 「」 quotes (dialogue)
  - Skip compound-word prefixes (还是/只是/可是 etc.)

Usage:
  python tools/fix_v6_blocking.py --dry-run
  python tools/fix_v6_blocking.py
"""
import re
import os
import sys
import json

ROOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# ---- Exclude sets (mirrors scanner) ----
# Only skip 是不是 (scanner only checks text[start-1] === '是')
PREV_EXCLUDE = set('是')


def mask_quoted(text):
    """Replace 「」 quotes with spaces to skip them."""
    return re.sub(r'「[^」]*」', lambda m: ' ' * len(m.group(0)), text)


def unmask_quoted(masked, original):
    """Restore original quotes from masked version."""
    result = []
    for i in range(len(masked)):
        if masked[i] == ' ' and original[i] != ' ':
            result.append(original[i])
        else:
            result.append(masked[i])
    return ''.join(result)


# ---- Patterns ----
# not-is: 不是X，是Y (X ≤24 chars, Y ≤30 chars, same sentence)
not_is_re = re.compile(
    r'不是([^。！？!?\n]{1,24})[，,]\s*是([^。！？!?\n]{1,30})'
)
# not-is with period separator: 不是X。是Y
not_is_period_re = re.compile(
    r'不是([^。！？!?\n]{1,24})。\s*是([^。！？!?\n]{1,30})'
)

# not-is with 是。variant: 不是X，是。Y (Y is quoted content after period)
not_is_comma_is_period_re = re.compile(
    r'不是([^。！？!?\n]{1,24})[，,]\s*是。\s*([^。！？!?\n]{1,30})'
)
# not-is with 是。variant (period-separated): 不是X。是。Y
not_is_period_is_period_re = re.compile(
    r'不是([^。！？!?\n]{1,24})。\s*是。\s*([^。！？!?\n]{1,30})'
)
# not-is with 不是。X。是。Y: 不是。"自己"。是。"下一个自己"
not_is_period_content_is_period_re = re.compile(
    r'不是。\s*([^。！？!?\n]{1,20})。\s*是。\s*([^。！？!?\n]{1,30})'
)
# not-is with repeated subject: 不是X。0428是。Y
not_is_subject_is_period_re = re.compile(
    r'不是([^。！？!?\n]{1,24})。\s*(\d{4})\s*是。\s*([^。！？!?\n]{1,30})'
)

# compound: 不是X，不是Y。是Z。→ isZ (also handles 、 separator)
compound_neg_re = re.compile(
    r'(?:不是[^。！？!?\n]{1,20}[，,、]){2,}是([^。！？!?\n]{1,30})'
)

# reverse: 是X，不是Y
reverse_re = re.compile(
    r'是([^。！？!?\n，,]{1,12})[，,]\s*(?:而)?不是([^。！？!?\n]{1,20})'
)

# negation: 没有X，没有Y。→ 没有X。
negation_re = re.compile(
    r'没有([^。！？!?\n，,、]+?)(?:[，,]没有[^。！？!?\n，,、]+?)+([。！？!?])'
)
# negation-parade with 只有 continuation: 没有X，没有Y，只有Z → 没有X，只有Z
negation_zhiyou_re = re.compile(
    r'没有([^。！？!?\n，,、（()]+?)[，,]没有[^。！？!?\n，,、（()]*[（()]\s*[^）)]*\s*[）)][，,]只有'
)
# not-is false positive: 不是因为"..." → drop the 不是 if 是 is inside quotes
not_is_reason_re = re.compile(
    r'不是因为\s*[\"“]([^\"”]+)[\"”]'
)
negation_short_re = re.compile(
    r'没([^。！？!?\n，,、]+?)(?:[，,]没[^。！？!?\n，,、]+?)+([。！？!?])'
)
# 不是X，不是Y。→ 不是X。
negation_bushi_re = re.compile(
    r'不是([^。！？!?\n，,、]{1,20}?)(?:[，,]不是[^。！？!?\n，,、]{1,20}?)+([。！？!?])'
)

# em-dash
ascii_emdash_line_re = re.compile(r'^\s*--\s*[\r\n]*', re.MULTILINE)
fullwidth_emdash_re = re.compile(r'[—⸺]{2,}')


# ---- Fix functions ----

def fix_not_is(text):
    """Replace 不是X，是Y → 是Y (keep Y verbatim, no extra punctuation)."""
    masked = mask_quoted(text)
    changes = []
    for m in not_is_re.finditer(masked):
        start = m.start()
        if start > 0 and masked[start-1] in PREV_EXCLUDE:
            continue
        y = m.group(2).strip()
        if not y:
            continue
        changes.append((m.start(), m.end(), '是' + y))
    # Apply in reverse to preserve positions
    result = masked
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return unmask_quoted(result, text)


def fix_not_is_period(text):
    """Replace 不是X。是Y → 是Y (period-separated variant)."""
    masked = mask_quoted(text)
    changes = []
    for m in not_is_period_re.finditer(masked):
        start = m.start()
        if start > 0 and masked[start-1] in PREV_EXCLUDE:
            continue
        y = m.group(2).strip()
        if not y:
            continue
        changes.append((m.start(), m.end(), '是' + y))
    result = masked
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return unmask_quoted(result, text)


def fix_not_is_comma_is_period(text):
    """Replace 不是X，是。Y → 是。Y."""
    masked = mask_quoted(text)
    changes = []
    for m in not_is_comma_is_period_re.finditer(masked):
        start = m.start()
        if start > 0 and masked[start-1] in PREV_EXCLUDE:
            continue
        y = m.group(2).strip()
        if not y:
            continue
        changes.append((m.start(), m.end(), '是。' + y))
    result = masked
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return unmask_quoted(result, text)


def fix_not_is_period_is_period(text):
    """Replace 不是X。是。Y → 是。Y."""
    masked = mask_quoted(text)
    changes = []
    for m in not_is_period_is_period_re.finditer(masked):
        start = m.start()
        if start > 0 and masked[start-1] in PREV_EXCLUDE:
            continue
        y = m.group(2).strip()
        if not y:
            continue
        changes.append((m.start(), m.end(), '是。' + y))
    result = masked
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return unmask_quoted(result, text)


def fix_not_is_period_content_is_period(text):
    """Replace 不是。X。是。Y → 是。Y."""
    masked = mask_quoted(text)
    changes = []
    for m in not_is_period_content_is_period_re.finditer(masked):
        y = m.group(2).strip()
        if not y:
            continue
        changes.append((m.start(), m.end(), '是。' + y))
    result = masked
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return unmask_quoted(result, text)


def fix_not_is_subject_is_period(text):
    """Replace 不是X。0428是。Y → 0428是。Y."""
    masked = mask_quoted(text)
    changes = []
    for m in not_is_subject_is_period_re.finditer(masked):
        start = m.start()
        if start > 0 and masked[start-1] in PREV_EXCLUDE:
            continue
        subject = m.group(2)
        y = m.group(3).strip()
        if not y:
            continue
        changes.append((m.start(), m.end(), subject + '是。' + y))
    result = masked
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return unmask_quoted(result, text)


def fix_compound_neg(text):
    """Replace 不是A，不是B。是C → 是C."""
    masked = mask_quoted(text)
    changes = []
    for m in compound_neg_re.finditer(masked):
        y = m.group(1).strip()
        if not y:
            continue
        changes.append((m.start(), m.end(), '是' + y))
    result = masked
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return unmask_quoted(result, text)


def fix_reverse(text):
    """Replace 是X，不是Y → 是X."""
    masked = mask_quoted(text)
    changes = []
    for m in reverse_re.finditer(masked):
        start = m.start()
        if start > 0 and masked[start-1] in PREV_EXCLUDE:
            continue
        x = m.group(1).strip()
        if not x:
            continue
        changes.append((m.start(), m.end(), '是' + x))
    result = masked
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return unmask_quoted(result, text)


def fix_negation(m):
    x = m.group(1).strip()
    end = m.group(2)
    return ('没有' + x + end) if x else m.group(0)


def fix_negation_bushi(m):
    x = m.group(1).strip()
    end = m.group(2)
    return ('不是' + x + end) if x else m.group(0)


def fix_negation_zhiyou(text):
    """Replace 没有X，没有Y（parenthetical），只有Z → 没有X，只有Z."""
    changes = []
    for m in negation_zhiyou_re.finditer(text):
        x = m.group(1).strip()
        if not x:
            continue
        changes.append((m.start(), m.end(), '没有' + x + '，只有'))
    result = text
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return result


def fix_not_is_reason(text):
    """Replace 不是因为"..."。"..."。是因为 → 是因为."""
    changes = []
    for m in not_is_reason_re.finditer(text):
        # Only replace if followed by 。是因为
        end_pos = m.end()
        if end_pos < len(text) and text[end_pos:end_pos+3] == '。是因为':
            changes.append((m.start(), end_pos+1, '是因为'))
    result = text
    for start, end, replacement in sorted(changes, reverse=True):
        result = result[:start] + replacement + result[end:]
    return result


def fix_emdash_line(text):
    return ascii_emdash_line_re.sub('', text)


def fix_emdash_text(text):
    def repl(m):
        matched = m.group(0)
        if matched.startswith('>') or matched.startswith('「'):
            return matched
        before = text[max(0, m.start()-3):m.start()]
        after = text[m.end():min(len(text), m.end()+3)]
        if '「' in before or '」' in after:
            return matched
        if before and ('一' <= before[-1] <= '鿿' or before[-1] in '"""'''):
            return '，'
        return '。'
    return fullwidth_emdash_re.sub(repl, text)


def process_file(filepath, dry_run=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    modified = original

    before_count = {
        'not-is': len(not_is_re.findall(mask_quoted(modified)))
                + len(not_is_period_re.findall(mask_quoted(modified)))
                + len(not_is_comma_is_period_re.findall(mask_quoted(modified)))
                + len(not_is_period_is_period_re.findall(mask_quoted(modified)))
                + len(not_is_period_content_is_period_re.findall(mask_quoted(modified)))
                + len(not_is_subject_is_period_re.findall(mask_quoted(modified))),
        'compound': len(compound_neg_re.findall(mask_quoted(modified))),
        'reverse': len(reverse_re.findall(mask_quoted(modified))),
        'negation': len(negation_re.findall(modified)) + len(negation_short_re.findall(modified)),
        'negation-bushi': len(negation_bushi_re.findall(modified)),
        'emdash-line': len(ascii_emdash_line_re.findall(modified)),
        'emdash-text': len(fullwidth_emdash_re.findall(modified)),
    }

    modified = fix_emdash_line(modified)
    modified = fix_emdash_text(modified)
    modified = fix_compound_neg(modified)
    modified = fix_not_is(modified)
    modified = fix_not_is_period(modified)
    modified = fix_not_is_comma_is_period(modified)
    modified = fix_not_is_period_is_period(modified)
    modified = fix_not_is_period_content_is_period(modified)
    modified = fix_not_is_subject_is_period(modified)
    modified = fix_reverse(modified)
    modified = negation_re.sub(fix_negation, modified)
    modified = negation_short_re.sub(fix_negation, modified)
    modified = negation_bushi_re.sub(fix_negation_bushi, modified)

    if modified == original:
        return False, 0, 0, {}

    old_cjk = sum(1 for c in original if '一' <= c <= '鿿')
    new_cjk = sum(1 for c in modified if '一' <= c <= '鿿')

    if not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified)

    return True, old_cjk, new_cjk, before_count


def main():
    dry_run = '--dry-run' in sys.argv

    v6_json = os.path.join(ROOT_DIR, '_v6_blocking_files.json')
    if not os.path.exists(v6_json):
        print("ERROR: _v6_blocking_files.json not found.")
        sys.exit(1)

    with open(v6_json, 'r', encoding='utf-8') as f:
        files = json.load(f)

    filepaths = []
    for entry in files:
        fp = entry.get('file', '')
        if fp:
            if not os.path.isabs(fp):
                fp = os.path.join(ROOT_DIR, fp)
            filepaths.append(fp)

    mode = "DRY-RUN" if dry_run else "APPLY"
    print(f"=== V6 Blocking Fix: {mode} ===")
    print(f"Files: {len(filepaths)}")
    print()

    fixed = 0
    unchanged = 0
    cjk_delta_total = 0
    errors = 0

    for i, filepath in enumerate(filepaths, 1):
        if not os.path.exists(filepath):
            print(f"  [{i}/{len(filepaths)}] SKIP: {os.path.basename(filepath)}")
            errors += 1
            continue
        try:
            changed, old_cjk, new_cjk, before = process_file(filepath, dry_run)
            if changed:
                fixed += 1
                delta = new_cjk - old_cjk
                cjk_delta_total += delta
                status = "DRY" if dry_run else "FIXED"
                pinfo = ', '.join(f"{k}:{v}" for k, v in before.items() if v > 0)
                print(f"  [{i}/{len(filepaths)}] {status}: {os.path.basename(filepath)} cjk:{old_cjk}->{new_cjk}({delta:+d}) [{pinfo}]")
            else:
                unchanged += 1
        except Exception as e:
            print(f"  [{i}/{len(filepaths)}] ERROR: {os.path.basename(filepath)} — {e}")
            errors += 1

    print(f"\n=== Summary ===")
    print(f"  Modified:  {fixed}")
    print(f"  Unchanged: {unchanged}")
    print(f"  Errors:    {errors}")
    print(f"  CJK Δ:     {cjk_delta_total:+d}")

    if dry_run:
        print("\n  No files changed. Re-run without --dry-run to apply.")


if __name__ == '__main__':
    main()