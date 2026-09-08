#!/usr/bin/env python3
# tools/fix_hen_comma.py
# Fix systematic broken-comma defect: "很，X" patterns across chapter prose.
#
# Root cause: a prior bad processing pass inserted a comma right after 很
# (and dropped 像 in some cases), producing ungrammatical "很，X".
# "很，" is NEVER correct Chinese — 很 is an adverb directly preceding what
# it modifies; a comma after it is always an error.
#
# Rules:
#   A. "很，" + [但而却都那这只]  -> "很像，"  (像 was dropped; what follows
#      is a new clause, so keep the comma as the clause boundary)
#   B. "很，" + [我你他她它咱]    -> "很像"   (像 was dropped; pronoun is the
#      object of 像, one phrase, no comma)
#   C. otherwise                  -> "很"     (comma wrongly splits adverb
#      from adjective; remove the comma)
#
# Preserves file encoding exactly (binary read/write, BOM status kept).
import os, glob

RULE_A = set('但而却都那这只')   # clause follows -> keep comma after restored 像
RULE_B = set('我你他她它咱')    # pronoun (object of 像) -> remove comma

def fix_text(text):
    changes = []
    out = []
    i = 0
    n = len(text)
    while i < n:
        if i + 2 < n and text[i] == '很' and text[i + 1] == '，':
            nxt = text[i + 2]
            ctx_b = text[max(0, i - 8):i]
            ctx_a = text[i + 2:i + 10]
            orig = ctx_b + '很，' + ctx_a
            if nxt in RULE_A:
                out.append('很像，')
                new = ctx_b + '很像，' + ctx_a
                changes.append(('A', orig, new))
            elif nxt in RULE_B:
                out.append('很像')
                new = ctx_b + '很像' + ctx_a
                changes.append(('B', orig, new))
            else:
                out.append('很')
                new = ctx_b + '很' + ctx_a
                changes.append(('C', orig, new))
            i += 2  # skip past "很，"; the following char is emitted next loop
        else:
            out.append(text[i])
            i += 1
    return ''.join(out), changes

def process_file(path):
    with open(path, 'rb') as f:
        raw_bytes = f.read()
    has_bom = raw_bytes.startswith(b'\xef\xbb\xbf')
    raw = raw_bytes.decode('utf-8-sig')
    new, changes = fix_text(raw)
    if changes:
        out_bytes = new.encode('utf-8')
        if has_bom:
            out_bytes = b'\xef\xbb\xbf' + out_bytes
        with open(path, 'wb') as f:
            f.write(out_bytes)
    return changes

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chapters_dir = os.path.join(base, 'chapters')
    files = glob.glob(os.path.join(chapters_dir, '**', '*-polished.md'), recursive=True)
    total = 0
    by_rule = {'A': 0, 'B': 0, 'C': 0}
    for path in sorted(files):
        with open(path, 'rb') as f:
            if '很，'.encode('utf-8') not in f.read():
                continue
        changes = process_file(path)
        if changes:
            print(f'\n=== {os.path.relpath(path, base)} ({len(changes)}) ===')
            for rule, orig, new in changes:
                print(f'  [{rule}] {orig}  ->  {new}')
                by_rule[rule] += 1
            total += len(changes)
    print(f'\nTotal changes: {total}  (A={by_rule["A"]} B={by_rule["B"]} C={by_rule["C"]})')
