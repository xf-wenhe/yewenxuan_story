# -*- coding: utf-8 -*-
"""R298 engine: the registered-station cleanup round.

14 whole-line replacements across 7 chapters, each line anchored by
(line number, verbatim old text).  The new line is derived from the old by the
smallest witnessed edit (see tools/r298_sites.json for the per-station
evidence).  Guards run in memory before any write: anchor verbatim, identical
line count, tail byte, BOM state, CR, per-file CJK delta, the 1000-chapter
floor, and an inverse check (replacing `new` back with `old` must rebuild the
original byte for byte).

Usage:  python tools/fix_r298.py --dry-run    (default)
        python tools/fix_r298.py --apply
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, "tools", "r298_sites.json")
CJK = re.compile(r"[㐀-䶿一-鿿豈-﫿]")
FLOOR = 3000
VOLS = [(1, 1, 100), (2, 101, 250), (3, 251, 400), (4, 401, 550),
        (5, 551, 750), (6, 751, 918), (7, 919, 1000)]


def nj(s):
    return len(CJK.findall(s))


def path_of(n):
    for v, lo, hi in VOLS:
        if lo <= n <= hi:
            return "chapters/volume-%d/chapter-%0*d-polished.md" % (v, 2 if v == 1 else 3, n)
    raise KeyError(n)


class Abort(Exception):
    pass


def plan(rel, text, recs):
    lines = text.split("\n")
    out = list(lines)
    for r in sorted(recs, key=lambda x: -x["line"]):
        i = r["line"] - 1
        if not (0 <= i < len(lines)):
            raise Abort("%s L%d out of range" % (rel, r["line"]))
        if lines[i] != r["old"]:
            raise Abort("%s L%d anchor mismatch: %r"
                        % (rel, r["line"], lines[i][:60]))
        out[i] = r["new"]
    new = "\n".join(out)
    if len(new.split("\n")) != len(lines):
        raise Abort("%s line count changed" % rel)
    # inverse: restoring `old` must rebuild the original exactly
    back = list(out)
    for r in recs:
        back[r["line"] - 1] = r["old"]
    if "\n".join(back) != text:
        raise Abort("%s inverse check failed" % rel)
    return new


def main(argv):
    mode = "apply" if "--apply" in argv else "dry"
    d = json.load(io.open(SITES, encoding="utf-8"))
    by = {}
    for r in d["records"]:
        by.setdefault(r["path"], []).append(r)

    prepared, failures = [], []
    for rel in sorted(by):
        p = os.path.join(ROOT, rel.replace("/", os.sep))
        raw = io.open(p, "rb").read()
        bom = raw.startswith(b"\xef\xbb\xbf")
        body = raw[3:] if bom else raw
        if b"\r" in body:
            failures.append("%s: CR in source" % rel)
            continue
        text = body.decode("utf-8")
        try:
            new = plan(rel, text, by[rel])
        except Abort as e:
            failures.append(str(e))
            continue
        if "\n\n\n" in new:
            failures.append("%s: triple newline introduced" % rel)
        prepared.append({"rel": rel, "raw": raw, "bom": bom, "text": text,
                         "new": new, "delta": nj(new) - nj(text)})

    if failures:
        print("ABORT -- %d failure(s):" % len(failures))
        for f in failures:
            print("  " + f)
        return 1

    touched = dict((p["rel"], p) for p in prepared)
    lib_before = lib_after = 0
    min_after = None
    sub = []
    for n in range(1, 1001):
        rel = path_of(n)
        if rel in touched:
            before = nj(touched[rel]["text"])
            after = nj(touched[rel]["new"])
        else:
            raw = io.open(os.path.join(ROOT, rel.replace("/", os.sep)), "rb").read()
            body = raw[3:] if raw.startswith(b"\xef\xbb\xbf") else raw
            before = after = nj(body.decode("utf-8"))
        lib_before += before
        lib_after += after
        if min_after is None or after < min_after:
            min_after = after
        if after < FLOOR:
            sub.append((n, after))
    if sub:
        print("ABORT -- floor breach: %s" % sub)
        return 1
    if lib_after != d["meta"]["library_after"]:
        print("ABORT -- library %d != dataset %d" % (lib_after, d["meta"]["library_after"]))
        return 1

    print("R298 %s -- %d records / %d files" % (mode, len(d["records"]), len(prepared)))
    print("  library %d -> %d (%+d); min chapter %d"
          % (lib_before, lib_after, lib_after - lib_before, min_after))
    for p in prepared:
        print("    %-46s %+d" % (p["rel"].replace("chapters/", ""), p["delta"]))

    if mode != "apply":
        return 0
    for p in prepared:
        raw = (b"\xef\xbb\xbf" if p["bom"] else b"") + p["new"].encode("utf-8")
        if raw[-1:] != p["raw"][-1:]:
            print("ABORT -- tail byte changed for %s" % p["rel"])
            return 1
        io.open(os.path.join(ROOT, p["rel"].replace("/", os.sep)), "wb").write(raw)
    print("APPLIED %d files" % len(prepared))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
