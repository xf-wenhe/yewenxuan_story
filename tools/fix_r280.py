# -*- coding: utf-8 -*-
"""R280 engine: clear the last whole-line T2/MIX filler sites out of the 98
chapters R279 pushed under the 3000 CJK floor, then splice authored coda
paragraphs in above each end marker so every chapter clears 3050.

Dataset tools/r280_sites.json (built by _r280_build_sites.py from the
r280_t2scan census + the ten r280_b*_text.json prose batches): per chapter a
list of delete sites (line_no / verbatim text / context) and one coda block
(anchor （第X章完）, paragraphs).

Delete mechanics -- a site removes the filler LINE and enough newlines that
exactly one blank line is left between its neighbours:

    [A] [""] [filler] [""] [B]   nl=2 -> [A] [""] [B]      (320 sites)
    [A] [filler] [""] [B]        nl=1 -> [A] [""] [B]      (4 sites: 193/553/559/652)

Insert mechanics -- the coda's paragraphs are spliced in blank-separated
immediately above the last line that is exactly the end marker.  For
ch577/580/590 the marker is welded to the last paragraph's text; the engine
first splits it onto its own line (house convention: 988 of 1000 chapters
carry it standalone), then splices.  ch724 carries a stray welded marker
mid-file -- registered, untouched; its anchor is the last exact marker line.

Fail-closed (R268/R279 paradigm): every chapter is computed and validated IN
MEMORY first -- line content, contexts, family property of the deleted lines,
marker census, de-AI prose rules, CJK table, both inverse checks (re-inserting
deleted lines in ASCENDING order must rebuild the file byte for byte, taking
the inserted block back out must restore the post-delete text).  Only when all
98 chapters pass is anything written, so no guard can leave a half-written
round.  Files are read/written as raw bytes; BOM and EOL must round-trip.

Usage:  python tools/fix_r280.py --dry-run   (default: dry run)
        python tools/fix_r280.py --apply
"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, 'tools', 'r280_sites.json')
R279 = os.path.join(ROOT, 'tools', 'r279_sites.json')

CJK = re.compile(r'[㐀-䶿一-鿿豈-﫿]')
SPLIT = re.compile(r'[^。！？…]*[。！？…]|[^。！？…]+')
TARGET = 3050

L1_WORDS = ['仿佛', '犹如', '宛若', '如同', '深吸一口气', '缓缓', '不禁', '微微', '轻轻',
            '淡淡', '眼中闪过', '嘴角勾起', '眉头微皱', '眉眼低垂', '瞳孔微缩', '心中暗道',
            '不由得', '不容置疑', '不容置喙', '不易察觉', '显而易见', '毫无疑问', '不可否认',
            '坚定', '闪烁着光芒', '狡黠', '深邃', '凛冽', '冰冷', '不由自主', '情不自禁',
            '自然而然']
DEADLY = [
    r'不是([^，。]{1,10})[，———]而是',
    r'带着([^，。]{1,10})的',
    r'声音不大[，———]却',
    r'他知道([^。]{0,30})[。\n]',
    r'她知道([^。]{0,30})[。\n]',
    r'仿佛([^，。]{1,10})一般',
    r'眼中闪过一丝([^，。]{1,6})',
    r'心中涌起一股([^，。]{1,6})',
    r'脑子在运转',
    r'脑中闪过([^，。]{1,8})',
    r'心中一([^，。]{1,4})',
]


def cjk(s):
    return len(CJK.findall(s))


def segs_of(text):
    out = []
    for m in SPLIT.finditer(text):
        t = m.group(0).strip().replace('\n', '')
        if t and cjk(t) >= 5:
            out.append(t)
    return out


def read_raw(path):
    with io.open(path, 'rb') as fh:
        raw = fh.read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    if bom:
        raw = raw[3:]
    text = raw.decode('utf-8')
    if '\r' in text:
        abort('%s has CR bytes' % path)
    return text, bom


def write_raw(path, text, bom):
    data = text.encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    tmp = path + '.r280tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def line_offsets(text):
    offs, off = [], 0
    for line in text.split('\n'):
        if text[off:off + len(line)] != line:
            abort('line/offset mismatch')
        offs.append(off)
        off += len(line) + 1
    return offs


def abort(msg):
    print('ABORT: ' + msg)
    sys.exit(2)


def build():
    """Validate everything and return {path: (text_after, bom, n_del, delta)}."""
    with io.open(SITES, encoding='utf-8', newline='') as fh:
        sites = json.load(fh)
    with io.open(R279, encoding='utf-8', newline='') as fh:
        meta = json.load(fh)['meta']
    family = set(meta['family_members'])
    tier2 = set(meta['family_members']) - set(meta['machine_members'])

    out = {}
    n_sites = 0
    for chap in sites['chapters']:
        path = os.path.join(ROOT, chap['path'].replace('/', os.sep))
        text, bom = read_raw(path)
        lines = text.split('\n')
        offs = line_offsets(text)
        pre_triple = text.count('\n\n\n')
        anchor = chap['insert']['anchor']
        paras = chap['insert']['paras']

        # --- delete sites: content, context, family property, shape -----------
        seen = set()
        drop = 0
        dcjk = 0
        for r in chap['deletes']:
            li, want = r['line_no'], r['text']
            if li in seen:
                abort('%s duplicate line_no=%d' % (path, li))
            seen.add(li)
            if li < 1 or li >= len(lines) or lines[li] != want:
                abort('%s L%d content mismatch: %r'
                      % (path, li, (lines[li] if li < len(lines) else None)))
            keep = segs_of(want)
            if not keep or not all(s in family for s in keep) \
                    or not any(s in tier2 for s in keep):
                abort('%s L%d no longer a tier-2 family line' % (path, li))
            if lines[li - 1][-24:] != r['minus_ctx']:
                abort('%s L%d minus context mismatch' % (path, li))
            next2 = lines[li + 2] if li + 2 < len(lines) else ''
            if next2[:24] != r['plus_ctx']:
                abort('%s L%d plus context mismatch' % (path, li))
            if lines[li + 1] != '':
                abort('%s L%d not followed by a blank line' % (path, li))
            nl = 2 if lines[li - 1] == '' else 1
            if nl != r['nl'] or r['sep'] != 2 or cjk(want) != r['cjk']:
                abort('%s L%d shape/cjk drift' % (path, li))
            drop += nl
            dcjk += cjk(want)
        if [r['line_no'] for r in chap['deletes']] != sorted(
                r['line_no'] for r in chap['deletes']):
            abort('%s records not ascending' % path)

        # --- apply deletes by char offset, descending --------------------------
        after = text
        for r in sorted(chap['deletes'], key=lambda r: -r['line_no']):
            off = offs[r['line_no']]
            after = after[:off] + after[off + len(r['text']) + r['nl']:]
        # inverse: re-inserting the deleted lines in ASCENDING order rebuilds it
        probe = after.split('\n')
        for r in sorted(chap['deletes'], key=lambda r: r['line_no']):
            probe[r['line_no']:r['line_no']] = \
                [r['text'], ''] if r['nl'] == 2 else [r['text']]
        if '\n'.join(probe) != text:
            abort('%s delete round-trip differs' % path)
        if len(lines) - len(after.split('\n')) != drop:
            abort('%s split-length drop %d != %d'
                  % (path, len(lines) - len(after.split('\n')), drop))
        if cjk(text) - cjk(after) != dcjk:
            abort('%s deletion CJK %d != %d'
                  % (path, cjk(text) - cjk(after), dcjk))
        if after.count('\n\n\n') > pre_triple:
            abort('%s new triple newline after deletions' % path)

        # --- marker: split the welded one, then locate the exact anchor --------
        alines = after.split('\n')
        if chap['insert']['split_marker']:
            j = max(i for i, l in enumerate(alines) if l.strip())
            if alines[j] == anchor or not alines[j].endswith(anchor):
                abort('%s welded marker shape lost' % path)
            alines[j:j + 1] = [alines[j][:-len(anchor)], '', anchor]
        idxs = [i for i, l in enumerate(alines) if l == anchor]
        if len(idxs) != 1:
            abort('%s exact-marker count %d' % (path, len(idxs)))
        mi = idxs[0]
        if alines[mi - 1] != '' or mi != max(
                i for i, l in enumerate(alines) if l.strip()):
            abort('%s marker not blank-preceded / not last non-blank' % path)
        base_after = '\n'.join(alines)   # post-delete, post-split baseline

        # --- coda prose must obey the book's own de-AI rules -------------------
        full = '\n'.join(paras)
        for w in L1_WORDS:
            if w in full:
                abort('%s coda breaks L1: %s' % (path, w))
        for pat in DEADLY:
            m = re.search(pat, full)
            if m:
                abort('%s coda breaks deadly pattern %r' % (path, m.group(0)))
        for s in segs_of(full):
            if s in family:
                abort('%s coda reuses a family sentence: %s' % (path, s))

        # --- splice the block in, blank-separated, above the marker ------------
        block = []
        for i, p in enumerate(paras):
            block.append(p)
            if i != len(paras) - 1:
                block.append('')
        block.append('')
        alines[mi:mi] = block
        final = '\n'.join(alines)

        # --- final invariants --------------------------------------------------
        ins = cjk(full)
        if cjk(final) - cjk(text) != ins - dcjk:
            abort('%s CJK moved %d, table says %d'
                  % (path, cjk(final) - cjk(text), ins - dcjk))
        if cjk(final) != chap['cjk_expect']:
            abort('%s ends at %d CJK, table says %d'
                  % (path, cjk(final), chap['cjk_expect']))
        if cjk(final) < TARGET:
            abort('%s ends at %d CJK, under the %d target'
                  % (path, cjk(final), TARGET))
        if final.split('\n')[0] != lines[0]:
            abort('%s first line changed' % path)
        if final.count('\n\n\n') > pre_triple:
            abort('%s new triple newline after edit' % path)
        restored = list(alines)
        del restored[mi:mi + len(block)]
        if '\n'.join(restored) != base_after:
            abort('%s is not additive -- taking the block out does not '
                  'restore the post-delete text' % path)
        out[path] = (final, bom, len(chap['deletes']), ins - dcjk)
        n_sites += len(chap['deletes'])

    print('validated: %d chapters, %d delete sites, %d CJK deleted, '
          '%d CJK inserted, net %+d'
          % (len(out), n_sites,
             sum(c['deletes_cjk'] for c in sites['chapters']),
             sum(c['insert_cjk'] for c in sites['chapters']),
             sum(v[3] for v in out.values())))
    finals = {c['ch']: c['cjk_expect'] for c in sites['chapters']}
    print('final CJK %d..%d, all >= %d'
          % (min(finals.values()), max(finals.values()), TARGET))
    return out


def main():
    apply = '--apply' in sys.argv
    print('%s: R280' % ('APPLY' if apply else 'DRY-RUN'))
    out = build()
    if not apply:
        for p in sorted(out):
            rel = os.path.relpath(p, ROOT).replace(os.sep, '/')
            print('  %-46s -%d del sites, %+d CJK' % (rel, out[p][2], out[p][3]))
        print('DRY-RUN: %d chapters would change, %+d CJK'
              % (len(out), sum(v[3] for v in out.values())))
        return
    total = 0
    for p in sorted(out):
        after, bom, n, delta = out[p]
        write_raw(p, after, bom)
        total += delta
    print('APPLIED: %d chapters changed, %+d CJK' % (len(out), total))


if __name__ == '__main__':
    main()
