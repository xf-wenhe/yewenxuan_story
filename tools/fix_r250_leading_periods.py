# -*- coding: utf-8 -*-
"""R250: delete the paragraph-leading orphan 。 left behind by tools/deslop_v5_fix2.py.

The producing rule (deslop_v5_fix2.py:24) was

    re.sub(r'^。([一-鿿]{1,4})', r'\1', text, flags=re.MULTILINE)

which can only strip a leading 。 when 1-4 CJK chars follow on the SAME line.  Sites
whose body is longer than 4 CJK kept the 。, and the sibling passes
(deslop_v5_fix.py: r'。([一-鿿]{1,4})\\n' -> r'\1\\n') stripped the 。 off the short
line ABOVE them, so a bare 。 ended up opening a paragraph with nothing to attach to.
The 。 is inserted noise, never the author's punctuation -- chapter-124:73 proves it:
the pre-R214 text already read  ...空间螺。 / 。不是空的岩壁...  and reading it as
"...是空的"时间"" is the only coherent form.

Three deterministic edits, no authored character invented or deleted:

  A   871  delete the leading 。  (remainder is a self-contained sentence, or the
            previous line is blank so there is nothing to join onto)
  J   199  delete the leading 。 AND join the line onto the previous line (the body
            opens with a continuation char 是/了/的/在/有/没 or a closing quote)
  D   115  delete the whole line (it holds nothing but 。)

Expected: 1185 sites / 265 chapters; CJK 3658320 unchanged; line count -314.

Application contract
--------------------
Lines are split into (core, end) pairs so the exact terminator bytes survive -- 159
of the 265 files are CRLF and 10 of them carry a pre-existing \\r\\r\\n oddity (2327
occurrences) that must round-trip untouched.  Sites are edited in DESCENDING line
index so a deletion never shifts an index still to be processed, and each file is
written exactly once (R247 (1)).

Modes
-----
  --dry     print/write every planned edit; fail closed against SNAPSHOT
  --apply   perform the edits
  --audit   two-state site census (pre-fix must equal SNAPSHOT, post-fix must be 0)
  --verify  replay the edits from the HEAD blob and compare with the worktree
"""

import argparse
import collections
import glob
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(REPO)

CJK_RE = re.compile(r'[一-鿿]')
CONT = '是了的在有没'
CLOSERS = '」』"）】'
TOTAL = {'A': 871, 'J': 199, 'D': 115}

# Per-file site census, frozen from the read-only diagnosis.  Any deviation aborts.
SNAPSHOT = {
    'chapters/volume-1/chapter-20-polished.md': 'A1',
    'chapters/volume-1/chapter-65-polished.md': 'A1',
    'chapters/volume-2/chapter-101-polished.md': 'A2',
    'chapters/volume-2/chapter-103-polished.md': 'A3J2D4',
    'chapters/volume-2/chapter-104-polished.md': 'A1J1D1',
    'chapters/volume-2/chapter-106-polished.md': 'A1J1',
    'chapters/volume-2/chapter-107-polished.md': 'A2',
    'chapters/volume-2/chapter-108-polished.md': 'D2',
    'chapters/volume-2/chapter-111-polished.md': 'A2J1D4',
    'chapters/volume-2/chapter-112-polished.md': 'A5J1D3',
    'chapters/volume-2/chapter-113-polished.md': 'A3J3D1',
    'chapters/volume-2/chapter-114-polished.md': 'A4J2D2',
    'chapters/volume-2/chapter-115-polished.md': 'A1J1D3',
    'chapters/volume-2/chapter-116-polished.md': 'A3D2',
    'chapters/volume-2/chapter-117-polished.md': 'A6J1',
    'chapters/volume-2/chapter-118-polished.md': 'A3',
    'chapters/volume-2/chapter-119-polished.md': 'A1',
    'chapters/volume-2/chapter-120-polished.md': 'A1J2D1',
    'chapters/volume-2/chapter-121-polished.md': 'A1J1D1',
    'chapters/volume-2/chapter-122-polished.md': 'A3',
    'chapters/volume-2/chapter-123-polished.md': 'A2J1',
    'chapters/volume-2/chapter-124-polished.md': 'A1J1',
    'chapters/volume-2/chapter-126-polished.md': 'J1',
    'chapters/volume-2/chapter-132-polished.md': 'A1',
    'chapters/volume-2/chapter-136-polished.md': 'A1',
    'chapters/volume-2/chapter-138-polished.md': 'A1',
    'chapters/volume-2/chapter-139-polished.md': 'A2',
    'chapters/volume-2/chapter-140-polished.md': 'A3',
    'chapters/volume-2/chapter-141-polished.md': 'A1',
    'chapters/volume-2/chapter-142-polished.md': 'A1',
    'chapters/volume-2/chapter-143-polished.md': 'A5',
    'chapters/volume-2/chapter-147-polished.md': 'A2',
    'chapters/volume-2/chapter-148-polished.md': 'A4J2',
    'chapters/volume-2/chapter-149-polished.md': 'A2D1',
    'chapters/volume-2/chapter-150-polished.md': 'A1J3D3',
    'chapters/volume-2/chapter-151-polished.md': 'A5D1',
    'chapters/volume-2/chapter-152-polished.md': 'J1',
    'chapters/volume-2/chapter-155-polished.md': 'A1',
    'chapters/volume-2/chapter-156-polished.md': 'A1',
    'chapters/volume-2/chapter-159-polished.md': 'D1',
    'chapters/volume-2/chapter-172-polished.md': 'A1',
    'chapters/volume-2/chapter-173-polished.md': 'A1',
    'chapters/volume-2/chapter-174-polished.md': 'A1',
    'chapters/volume-2/chapter-178-polished.md': 'A1',
    'chapters/volume-2/chapter-187-polished.md': 'A1',
    'chapters/volume-2/chapter-189-polished.md': 'A2',
    'chapters/volume-2/chapter-192-polished.md': 'J1',
    'chapters/volume-2/chapter-200-polished.md': 'A3D1',
    'chapters/volume-2/chapter-212-polished.md': 'A1',
    'chapters/volume-2/chapter-216-polished.md': 'A1',
    'chapters/volume-2/chapter-218-polished.md': 'A1',
    'chapters/volume-2/chapter-222-polished.md': 'A2',
    'chapters/volume-2/chapter-224-polished.md': 'A2J2D1',
    'chapters/volume-2/chapter-227-polished.md': 'D1',
    'chapters/volume-2/chapter-228-polished.md': 'D1',
    'chapters/volume-2/chapter-229-polished.md': 'A1',
    'chapters/volume-2/chapter-230-polished.md': 'A1J1',
    'chapters/volume-2/chapter-234-polished.md': 'A1',
    'chapters/volume-2/chapter-237-polished.md': 'A1D1',
    'chapters/volume-2/chapter-238-polished.md': 'A2',
    'chapters/volume-2/chapter-239-polished.md': 'A3',
    'chapters/volume-2/chapter-240-polished.md': 'A3J1',
    'chapters/volume-2/chapter-241-polished.md': 'A4J1D2',
    'chapters/volume-2/chapter-242-polished.md': 'A1J1D1',
    'chapters/volume-2/chapter-243-polished.md': 'A6J3',
    'chapters/volume-2/chapter-244-polished.md': 'A2J2',
    'chapters/volume-2/chapter-245-polished.md': 'A4J5',
    'chapters/volume-2/chapter-246-polished.md': 'A8J1D1',
    'chapters/volume-2/chapter-247-polished.md': 'A4J7',
    'chapters/volume-2/chapter-248-polished.md': 'A5J1',
    'chapters/volume-2/chapter-249-polished.md': 'A2J1',
    'chapters/volume-2/chapter-250-polished.md': 'A5J5',
    'chapters/volume-3/chapter-251-polished.md': 'A3',
    'chapters/volume-3/chapter-252-polished.md': 'A3J1D1',
    'chapters/volume-3/chapter-253-polished.md': 'A2J6',
    'chapters/volume-3/chapter-254-polished.md': 'A3J1',
    'chapters/volume-3/chapter-255-polished.md': 'A2J1',
    'chapters/volume-3/chapter-256-polished.md': 'A1J3',
    'chapters/volume-3/chapter-257-polished.md': 'J1D1',
    'chapters/volume-3/chapter-258-polished.md': 'A1J1',
    'chapters/volume-3/chapter-259-polished.md': 'A1J3',
    'chapters/volume-3/chapter-260-polished.md': 'J5',
    'chapters/volume-3/chapter-261-polished.md': 'A1J3',
    'chapters/volume-3/chapter-262-polished.md': 'A3J2',
    'chapters/volume-3/chapter-263-polished.md': 'J3',
    'chapters/volume-3/chapter-264-polished.md': 'A1J3',
    'chapters/volume-3/chapter-266-polished.md': 'A1J2',
    'chapters/volume-3/chapter-267-polished.md': 'A3J2D1',
    'chapters/volume-3/chapter-268-polished.md': 'J2',
    'chapters/volume-3/chapter-269-polished.md': 'J2',
    'chapters/volume-3/chapter-270-polished.md': 'A1J3',
    'chapters/volume-3/chapter-275-polished.md': 'A1J2',
    'chapters/volume-3/chapter-278-polished.md': 'A2J2',
    'chapters/volume-3/chapter-281-polished.md': 'J2D2',
    'chapters/volume-3/chapter-282-polished.md': 'A2J4',
    'chapters/volume-3/chapter-283-polished.md': 'A2J2',
    'chapters/volume-3/chapter-285-polished.md': 'A1J5',
    'chapters/volume-3/chapter-286-polished.md': 'J3D1',
    'chapters/volume-3/chapter-287-polished.md': 'A1J1',
    'chapters/volume-3/chapter-288-polished.md': 'J1',
    'chapters/volume-3/chapter-289-polished.md': 'A1J2',
    'chapters/volume-3/chapter-290-polished.md': 'J5',
    'chapters/volume-3/chapter-291-polished.md': 'A4J3',
    'chapters/volume-3/chapter-292-polished.md': 'J2',
    'chapters/volume-3/chapter-294-polished.md': 'A2J2',
    'chapters/volume-3/chapter-295-polished.md': 'A3J3',
    'chapters/volume-3/chapter-296-polished.md': 'J1',
    'chapters/volume-3/chapter-297-polished.md': 'A1D1',
    'chapters/volume-3/chapter-298-polished.md': 'A1J1',
    'chapters/volume-3/chapter-299-polished.md': 'A1J3',
    'chapters/volume-3/chapter-300-polished.md': 'A1J4',
    'chapters/volume-3/chapter-301-polished.md': 'A4J2',
    'chapters/volume-3/chapter-303-polished.md': 'J2D1',
    'chapters/volume-3/chapter-304-polished.md': 'J3',
    'chapters/volume-3/chapter-305-polished.md': 'J3',
    'chapters/volume-3/chapter-306-polished.md': 'A2J1D1',
    'chapters/volume-3/chapter-307-polished.md': 'J1',
    'chapters/volume-3/chapter-308-polished.md': 'J1',
    'chapters/volume-3/chapter-310-polished.md': 'A2J2',
    'chapters/volume-3/chapter-311-polished.md': 'A2J3D1',
    'chapters/volume-3/chapter-313-polished.md': 'A1J2D1',
    'chapters/volume-3/chapter-314-polished.md': 'J2',
    'chapters/volume-3/chapter-315-polished.md': 'J2',
    'chapters/volume-3/chapter-316-polished.md': 'J2',
    'chapters/volume-3/chapter-317-polished.md': 'J3',
    'chapters/volume-3/chapter-320-polished.md': 'A2',
    'chapters/volume-3/chapter-322-polished.md': 'A1D1',
    'chapters/volume-3/chapter-323-polished.md': 'A1',
    'chapters/volume-3/chapter-324-polished.md': 'A1J1',
    'chapters/volume-3/chapter-325-polished.md': 'A4J1',
    'chapters/volume-3/chapter-326-polished.md': 'J2',
    'chapters/volume-3/chapter-327-polished.md': 'A1',
    'chapters/volume-3/chapter-329-polished.md': 'A1J1D2',
    'chapters/volume-3/chapter-330-polished.md': 'A1',
    'chapters/volume-3/chapter-331-polished.md': 'A2J2D2',
    'chapters/volume-3/chapter-332-polished.md': 'A1',
    'chapters/volume-3/chapter-333-polished.md': 'A1',
    'chapters/volume-3/chapter-334-polished.md': 'A2J1D2',
    'chapters/volume-3/chapter-335-polished.md': 'A3J1',
    'chapters/volume-3/chapter-336-polished.md': 'A1',
    'chapters/volume-3/chapter-340-polished.md': 'J1',
    'chapters/volume-3/chapter-341-polished.md': 'D4',
    'chapters/volume-3/chapter-342-polished.md': 'A1J1',
    'chapters/volume-3/chapter-343-polished.md': 'A1',
    'chapters/volume-3/chapter-344-polished.md': 'A2J1',
    'chapters/volume-3/chapter-345-polished.md': 'D1',
    'chapters/volume-3/chapter-346-polished.md': 'J1',
    'chapters/volume-3/chapter-348-polished.md': 'A3',
    'chapters/volume-3/chapter-349-polished.md': 'D1',
    'chapters/volume-3/chapter-350-polished.md': 'A1D2',
    'chapters/volume-3/chapter-352-polished.md': 'A1J1',
    'chapters/volume-3/chapter-353-polished.md': 'D2',
    'chapters/volume-3/chapter-355-polished.md': 'A1D1',
    'chapters/volume-3/chapter-356-polished.md': 'A1',
    'chapters/volume-3/chapter-357-polished.md': 'A1J1D1',
    'chapters/volume-3/chapter-358-polished.md': 'A1D2',
    'chapters/volume-3/chapter-359-polished.md': 'A1',
    'chapters/volume-3/chapter-360-polished.md': 'A2',
    'chapters/volume-3/chapter-361-polished.md': 'A2',
    'chapters/volume-3/chapter-362-polished.md': 'A3D1',
    'chapters/volume-3/chapter-363-polished.md': 'A3D2',
    'chapters/volume-3/chapter-364-polished.md': 'J1',
    'chapters/volume-3/chapter-365-polished.md': 'A1',
    'chapters/volume-3/chapter-368-polished.md': 'A1',
    'chapters/volume-3/chapter-369-polished.md': 'J1',
    'chapters/volume-3/chapter-371-polished.md': 'A3',
    'chapters/volume-3/chapter-372-polished.md': 'A1D1',
    'chapters/volume-3/chapter-373-polished.md': 'A1J1D1',
    'chapters/volume-3/chapter-374-polished.md': 'A1D1',
    'chapters/volume-3/chapter-377-polished.md': 'A4D2',
    'chapters/volume-3/chapter-378-polished.md': 'A1D1',
    'chapters/volume-3/chapter-379-polished.md': 'A1',
    'chapters/volume-3/chapter-380-polished.md': 'A3J1',
    'chapters/volume-3/chapter-381-polished.md': 'A3D3',
    'chapters/volume-3/chapter-382-polished.md': 'A4D2',
    'chapters/volume-3/chapter-384-polished.md': 'A1D1',
    'chapters/volume-3/chapter-387-polished.md': 'D2',
    'chapters/volume-3/chapter-395-polished.md': 'J1D2',
    'chapters/volume-3/chapter-397-polished.md': 'A1',
    'chapters/volume-3/chapter-398-polished.md': 'A2',
    'chapters/volume-3/chapter-399-polished.md': 'A2',
    'chapters/volume-3/chapter-400-polished.md': 'J1',
    'chapters/volume-5/chapter-551-polished.md': 'A1',
    'chapters/volume-5/chapter-553-polished.md': 'A4',
    'chapters/volume-5/chapter-554-polished.md': 'A1',
    'chapters/volume-5/chapter-555-polished.md': 'A3',
    'chapters/volume-5/chapter-556-polished.md': 'A5D2',
    'chapters/volume-5/chapter-557-polished.md': 'A6',
    'chapters/volume-5/chapter-558-polished.md': 'A5',
    'chapters/volume-5/chapter-559-polished.md': 'A3',
    'chapters/volume-5/chapter-560-polished.md': 'A5D1',
    'chapters/volume-5/chapter-561-polished.md': 'A3',
    'chapters/volume-5/chapter-563-polished.md': 'A3',
    'chapters/volume-5/chapter-573-polished.md': 'A1',
    'chapters/volume-5/chapter-578-polished.md': 'A1',
    'chapters/volume-5/chapter-581-polished.md': 'D1',
    'chapters/volume-5/chapter-594-polished.md': 'D2',
    'chapters/volume-5/chapter-599-polished.md': 'A1',
    'chapters/volume-5/chapter-603-polished.md': 'A3D2',
    'chapters/volume-5/chapter-606-polished.md': 'D1',
    'chapters/volume-5/chapter-607-polished.md': 'A1',
    'chapters/volume-5/chapter-610-polished.md': 'A2',
    'chapters/volume-5/chapter-611-polished.md': 'A19D1',
    'chapters/volume-5/chapter-612-polished.md': 'A15',
    'chapters/volume-5/chapter-614-polished.md': 'A1',
    'chapters/volume-5/chapter-615-polished.md': 'A5',
    'chapters/volume-5/chapter-616-polished.md': 'A10',
    'chapters/volume-5/chapter-631-polished.md': 'D1',
    'chapters/volume-5/chapter-637-polished.md': 'A6',
    'chapters/volume-5/chapter-640-polished.md': 'A1D1',
    'chapters/volume-5/chapter-644-polished.md': 'A15',
    'chapters/volume-5/chapter-650-polished.md': 'A2',
    'chapters/volume-5/chapter-651-polished.md': 'A8D1',
    'chapters/volume-5/chapter-652-polished.md': 'A9',
    'chapters/volume-5/chapter-653-polished.md': 'A10',
    'chapters/volume-5/chapter-661-polished.md': 'A18D1',
    'chapters/volume-5/chapter-662-polished.md': 'A17D1',
    'chapters/volume-5/chapter-663-polished.md': 'A28',
    'chapters/volume-5/chapter-667-polished.md': 'A15D1',
    'chapters/volume-5/chapter-670-polished.md': 'A16',
    'chapters/volume-5/chapter-671-polished.md': 'A18D1',
    'chapters/volume-5/chapter-672-polished.md': 'A20',
    'chapters/volume-5/chapter-673-polished.md': 'A20',
    'chapters/volume-5/chapter-674-polished.md': 'A6',
    'chapters/volume-5/chapter-675-polished.md': 'A18',
    'chapters/volume-5/chapter-676-polished.md': 'A15',
    'chapters/volume-5/chapter-677-polished.md': 'A15',
    'chapters/volume-5/chapter-678-polished.md': 'A10',
    'chapters/volume-5/chapter-679-polished.md': 'A19',
    'chapters/volume-5/chapter-680-polished.md': 'A17',
    'chapters/volume-5/chapter-682-polished.md': 'A6',
    'chapters/volume-5/chapter-683-polished.md': 'A9',
    'chapters/volume-5/chapter-686-polished.md': 'A16',
    'chapters/volume-5/chapter-688-polished.md': 'A21',
    'chapters/volume-5/chapter-689-polished.md': 'A8',
    'chapters/volume-5/chapter-690-polished.md': 'A8',
    'chapters/volume-5/chapter-691-polished.md': 'A6',
    'chapters/volume-5/chapter-692-polished.md': 'A5',
    'chapters/volume-5/chapter-693-polished.md': 'A3',
    'chapters/volume-5/chapter-694-polished.md': 'A5',
    'chapters/volume-5/chapter-695-polished.md': 'A7',
    'chapters/volume-5/chapter-696-polished.md': 'A6',
    'chapters/volume-5/chapter-697-polished.md': 'A4',
    'chapters/volume-5/chapter-698-polished.md': 'A7',
    'chapters/volume-5/chapter-699-polished.md': 'A10',
    'chapters/volume-5/chapter-700-polished.md': 'A8',
    'chapters/volume-5/chapter-701-polished.md': 'A7',
    'chapters/volume-5/chapter-702-polished.md': 'A2',
    'chapters/volume-5/chapter-703-polished.md': 'A3',
    'chapters/volume-5/chapter-704-polished.md': 'A4',
    'chapters/volume-5/chapter-705-polished.md': 'A3',
    'chapters/volume-5/chapter-706-polished.md': 'A9',
    'chapters/volume-5/chapter-716-polished.md': 'D1',
    'chapters/volume-5/chapter-718-polished.md': 'A7',
    'chapters/volume-5/chapter-725-polished.md': 'A2',
    'chapters/volume-5/chapter-727-polished.md': 'D1',
    'chapters/volume-5/chapter-741-polished.md': 'A1',
    'chapters/volume-5/chapter-742-polished.md': 'A4D1',
    'chapters/volume-5/chapter-744-polished.md': 'A3D1',
    'chapters/volume-5/chapter-745-polished.md': 'A3D1',
    'chapters/volume-5/chapter-746-polished.md': 'A5',
    'chapters/volume-5/chapter-747-polished.md': 'A2D1',
    'chapters/volume-5/chapter-748-polished.md': 'A1D1',
    'chapters/volume-5/chapter-750-polished.md': 'D1',
    'chapters/volume-7/chapter-927-polished.md': 'A1',
}


# ---------------------------------------------------------------- line handling

def split_parts(raw):
    """[(core, end)] with core + end == raw, end holding the exact terminator bytes.

    A stray-CR line  X\\r\\r\\n  yields core 'X', end '\\r\\r\\n' -- the oddity is
    carried in the terminator, never in the text, so it round-trips untouched.
    """
    out = []
    for piece in re.findall(r'[^\n]*\n|[^\n]+', raw):
        core = piece.rstrip('\r\n')
        out.append((core, piece[len(core):]))
    return out


def join_parts(parts):
    return ''.join(core + end for core, end in parts)


def read_raw(path):
    with open(path, encoding='utf-8', newline='') as fh:
        return fh.read()


def write_raw(path, text):
    with open(path, 'w', encoding='utf-8', newline='') as fh:
        fh.write(text)


def classify(prev_core, core):
    body = core[1:]
    if body.strip() == '':
        return 'D'
    if not prev_core.strip():
        return 'A'
    if body[0] in CONT or body[0] in CLOSERS:
        return 'J'
    return 'A'


def plan(raw):
    """-> (parts, [(index, kind)]) for one file, ascending."""
    parts = split_parts(raw)
    if join_parts(parts) != raw:
        raise SystemExit('split/join is not lossless')
    sites = []
    for i, (core, _end) in enumerate(parts):
        if not core.startswith('。'):
            continue                      # 0 lines carry leading whitespace
        sites.append((i, classify(parts[i - 1][0] if i else '', core)))
    return parts, sites


def census(sites):
    c = collections.Counter(k for _, k in sites)
    return ''.join('%s%d' % (k, c[k]) for k in 'AJD' if c[k])


def contract(parts, sites):
    """Apply the plan in descending index order; returns the new text + the edit log."""
    log = []
    for i, kind in reversed(sites):
        core, end = parts[i]
        if kind == 'A':
            log.append(('A', i, core, core[1:]))
            parts[i] = (core[1:], end)
        elif kind == 'D':
            log.append(('D', i, core, None))
            del parts[i]
        else:
            pcore, pend = parts[i - 1]
            log.append(('J', i, pcore + '⏎' + core, pcore + core[1:]))
            parts[i - 1] = (pcore + core[1:], pend)
            del parts[i]
    log.reverse()
    return join_parts(parts), log


ALLOWED_DROP = {'。', '\n', '\r'}


def cjk_kept(raw, new):
    """The only characters the edits may remove are 。 and line breaks, and none may be
    added.  Together that proves the CJK text survived byte for byte -- the 。 is U+3002,
    outside [\\u4e00-\\u9fff], so no CJK count can move (R245 (2))."""
    if CJK_RE.findall(raw) != CJK_RE.findall(new):
        return False
    dropped = collections.Counter(raw) - collections.Counter(new)
    added = collections.Counter(new) - collections.Counter(raw)
    return not added and not (set(dropped) - ALLOWED_DROP)


def target_files():
    return sorted(f.replace('\\', '/') for f in glob.glob('chapters/volume-*/chapter-*.md'))


# --------------------------------------------------------------------- modes

def do_dry(limit_per_kind=6):
    got = {}
    tot = collections.Counter()
    all_sites = 0
    log_lines = []
    for f in target_files():
        raw = read_raw(f)
        parts, sites = plan(raw)
        if not sites:
            if f in SNAPSHOT:
                raise SystemExit('MISSING sites in %s (snapshot says %s)' % (f, SNAPSHOT[f]))
            continue
        got[f] = census(sites)
        tot.update(k for _, k in sites)
        all_sites += len(sites)
        new, log = contract(parts, sites)
        for kind, i, before, after in log:
            log_lines.append('%s\t%d\t%s\t%s\t%s' % (f, i + 1, kind, before, '' if after is None else after))
        shown = collections.Counter()
        for kind, i, before, after in log:
            shown[kind] += 1
            if shown[kind] <= limit_per_kind:
                print('  %s %s:%d  - %s' % (kind, f.replace('chapters/', ''), i + 1, before[:70]))
                print('  %s %s    + %s' % (' ' * len(kind), ' ' * len(str(i + 1)), 'DELETE' if after is None else after[:70]))
        if not cjk_kept(raw, new):
            raise SystemExit('CJK changed in %s' % f)
    out = os.path.join('.claude', 'tmp', 'r250_dry.txt')
    with open(out, 'w', encoding='utf-8', newline='') as fh:
        fh.write('\n'.join(log_lines) + '\n')
    print()
    print('files with sites: %d (snapshot %d)' % (len(got), len(SNAPSHOT)))
    print('sites total: %d  %s   (expected %d %s)'
          % (all_sites, dict(tot), sum(TOTAL.values()), TOTAL))
    bad = [f for f in set(got) | set(SNAPSHOT) if got.get(f) != SNAPSHOT.get(f)]
    print('snapshot mismatches: %d %s' % (len(bad), bad[:6]))
    print('full edit log: %s' % out)
    return not bad and dict(tot) == TOTAL


def do_apply():
    tot = collections.Counter()
    n = 0
    for f in target_files():
        raw = read_raw(f)
        parts, sites = plan(raw)
        if not sites:
            continue
        if census(sites) != SNAPSHOT.get(f):
            raise SystemExit('ABORT %s: %s != snapshot %s' % (f, census(sites), SNAPSHOT.get(f)))
        tot.update(k for _, k in sites)
        new, _log = contract(parts, sites)
        if not cjk_kept(raw, new):
            raise SystemExit('ABORT %s: CJK changed' % f)
        assert read_raw(f) == raw
        write_raw(f, new)
        n += 1
    if dict(tot) != TOTAL:
        raise SystemExit('ABORT: totals %s != %s' % (dict(tot), TOTAL))
    print('applied: %d files, %d sites, %s' % (n, sum(tot.values()), dict(tot)))


def do_audit():
    """Two-state (R247 (2)): pre-fix every file matches SNAPSHOT; post-fix nothing is left."""
    still = []
    pre = {}
    for f in target_files():
        _parts, sites = plan(read_raw(f))
        if sites:
            pre[f] = census(sites)
    if pre:
        bad = [f for f in set(pre) | set(SNAPSHOT) if pre.get(f) != SNAPSHOT.get(f)]
        print('STATE pre-fix: %d files still carry sites, %d disagree with SNAPSHOT %s'
              % (len(pre), len(bad), bad[:6]))
    else:
        print('STATE post-fix: 0 paragraph-leading 。 left in the whole library')
    for f in target_files():
        for i, (core, _end) in enumerate(split_parts(read_raw(f))):
            if core.startswith('。') and len(core) > 1 and core[1].strip():
                still.append((f, i + 1, core[:30]))
    print('residual mid-line 。-leading sites: %d' % len(still))
    return not pre and not still


def do_verify():
    """Replay the edits on the HEAD blob and compare against the worktree bytes."""
    same = eol_only = bad = skipped = 0
    for f in target_files():
        cur = read_raw(f)
        if f not in SNAPSHOT:
            skipped += 1
            continue
        blob = subprocess.run(['git', 'show', 'HEAD:' + f],
                              capture_output=True, check=True).stdout.decode('utf-8')
        bparts, bsites = plan(blob)
        if census(bsites) != SNAPSHOT[f]:
            print('  HEAD census differs %s: %s' % (f, census(bsites)))
        exp, _log = contract(bparts, bsites)
        if exp == cur:
            same += 1
        elif exp.replace('\r', '') == cur.replace('\r', ''):
            eol_only += 1
            print('  EOL-only diff (expected for CRLF worktree vs LF blob): %s' % f)
        else:
            bad += 1
            print('  MISMATCH %s' % f)
            for a, b in zip(exp.split('\n'), cur.split('\n')):
                if a != b:
                    print('    exp %r' % a[:80])
                    print('    got %r' % b[:80])
                    break
    print('verify: byte-identical %d, EOL-only %d, MISMATCH %d, no-site files %d'
          % (same, eol_only, bad, skipped))
    return bad == 0


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--audit', action='store_true')
    ap.add_argument('--verify', action='store_true')
    ap.add_argument('--cjk', action='store_true')
    a = ap.parse_args()
    if a.cjk:
        t = sum(len(CJK_RE.findall(read_raw(f))) for f in target_files())
        print('CJK total: %d' % t)
    elif a.dry:
        sys.exit(0 if do_dry() else 1)
    elif a.apply:
        do_apply()
    elif a.audit:
        sys.exit(0 if do_audit() else 1)
    elif a.verify:
        sys.exit(0 if do_verify() else 1)
    else:
        ap.print_help()
