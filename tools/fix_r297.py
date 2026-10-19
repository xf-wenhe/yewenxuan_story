# -*- coding: utf-8 -*-
"""R297 engine: the first stage of the tier-2 ruling (档1, two-stage).

Dataset tools/r297_sites.json carries three operation families:

  A  deletes   92 whole-line tier-2 sites (P1 13 + P3 79).  A site removes the
               filler LINE and, when the following line is blank, that blank too
               (nl=1), so exactly one separator is left between the neighbours.
               Ten sites sit in the V1/V2 blank-less dialect (nl=0) and remove
               the line alone.
  B  leads    141 Voice-round-4 dangling leads.  Commit 57d3f306 stripped the
               machine frame `0428备份在发光，说：` by replacing it with `。`,
               leaving an intransitive head (`叶文轩感受到。`) or a bare
               connective (`然后。`).  The repair restores the comma.
  C  refills    6 authored coda blocks spliced blank-separated above the end
               marker, holding each chapter at TARGET 3050 CJK.

Line-anchored throughout (the R286/R295 primitive): every site is located by
(line number, verbatim content), never by find-search.  Two passes: deletes and
leads produce `base`, then the coda blocks are located and spliced inside
`base` (so the descending-splice index shift can never be mis-modelled).  All
chapters are validated IN MEMORY before anything is written -- anchors,
contexts, CJK table, the 1000-chapter floor, and both inverse checks (ascending
re-insert must rebuild the file byte for byte; removing the spliced block must
restore `base`).  A guard failure writes nothing.

Usage:  python tools/fix_r297.py --dry-run    (default)
        python tools/fix_r297.py --apply
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, "tools", "r297_sites.json")
CJK = re.compile(r"[㐀-䶿一-鿿豈-﫿]")
FLOOR = 3000          # the library floor; 3050 is the dataset's refill TARGET
MARKER = re.compile(r"^（第[一二三四五六七八九十百零]+章完）$")
VOLS = [(1, 100), (101, 250), (251, 400), (401, 550), (551, 750), (751, 918),
        (919, 1000)]


def nj(s):
    return len(CJK.findall(s))


def path_of(n):
    for i, (lo, hi) in enumerate(VOLS, 1):
        if lo <= n <= hi:
            return "chapters/volume-%d/chapter-%0*d-polished.md" % (i, 2 if i == 1 else 3, n)
    raise ValueError(n)


class Abort(Exception):
    pass


def plan_file(spec, text):
    rel = spec.get("rel", "?")
    lines = text.split("\n")

    # ---------------- pass 1: deletes + leads, one descending sweep ----------
    ops = []
    for s in spec["deletes"]:
        i = s["line"] - 1
        if not (0 <= i < len(lines)):
            raise Abort("%s L%d out of range" % (rel, s["line"]))
        if lines[i] != s["text"]:
            raise Abort("%s L%d delete anchor mismatch: %r != %r"
                        % (rel, s["line"], lines[i][:50], s["text"][:50]))
        if s["nl"]:
            if i + 1 >= len(lines) or lines[i + 1].strip() != "":
                raise Abort("%s L%d expected a blank separator" % (rel, s["line"]))
        ops.append((i, "del", s))
    lead_idx = set()
    for s in spec["leads"]:
        i = s["line"] - 1
        raw = lines[i]
        head = raw.lstrip()
        off = len(raw) - len(head)
        if not head.startswith(s["lead"] + "。"):
            raise Abort("%s L%d lead anchor mismatch: %r"
                        % (rel, s["line"], raw[:50]))
        lead_idx.add(i)
        ops.append((i, "lead", (s, off)))
    overlap = lead_idx & set(o[0] for o in ops if o[1] == "del")
    if overlap:
        raise Abort("%s: a lead site collides with a delete site %s" % (rel, sorted(overlap)))

    out = list(lines)
    for i, kind, payload in sorted(ops, key=lambda o: -o[0]):
        if kind == "del":
            del out[i:i + (2 if payload["nl"] else 1)]
        else:
            s, off = payload
            raw = out[i]
            cut = off + len(s["lead"])
            if raw[cut] != "。":
                raise Abort("%s L%d: no period at the anchor offset" % (rel, s["line"]))
            out[i] = raw[:cut] + "，" + raw[cut + 1:]
    base = "\n".join(out)

    # ---- inverse check 1: re-insert the deleted lines ascending -> the text
    # with the lead edits applied (leads are in-place, so they must be replayed
    # here before the byte comparison).
    lead_text = list(lines)
    for i, kind, payload in sorted([o for o in ops if o[1] == "lead"],
                                   key=lambda o: o[0]):
        s, off = payload
        raw = lead_text[i]
        cut = off + len(s["lead"])
        lead_text[i] = raw[:cut] + "，" + raw[cut + 1:]
    back = list(out)
    for i, kind, payload in sorted([o for o in ops if o[1] == "del"],
                                   key=lambda o: o[0]):
        back[i:i] = [payload["text"]] + ([""] if payload["nl"] else [])
    if "\n".join(back) != "\n".join(lead_text):
        raise Abort("%s inverse-check 1 (ascending re-insert) failed" % rel)

    # ---------------- pass 2: coda blocks, located inside `base` ------------
    blines = base.split("\n")
    placed = []
    for s in sorted(spec["refills"], key=lambda x: -x["anchor_line"]):
        idx = [j for j, x in enumerate(blines) if x == s["anchor"]]
        if not idx:
            raise Abort("%s end marker %r not found" % (rel, s["anchor"]))
        ai = idx[-1]
        block = s["text"].split("\n")
        block = ([] if blines[ai - 1].strip() == "" else [""]) + block + [""]
        blines[ai:ai] = block
        placed.append((ai, block))
    new = "\n".join(blines)

    # ---- inverse check 2: removing the blocks must restore `base` ---------
    # `placed` records the exact spliced block and the pre-splice index, so the
    # removal never re-derives the leading blank from the mutated array (the
    # first draft did, and the block's own trailing blank made it self-skip).
    chk = list(blines)
    off = 0
    for ai, block in sorted(placed):
        lo = ai + off
        if chk[lo:lo + len(block)] != block:
            raise Abort("%s inverse-check 2 (block locate) failed at %r"
                        % (rel, block[0][:30]))
        del chk[lo:lo + len(block)]
        off -= len(block)
    if "\n".join(chk) != base:
        raise Abort("%s inverse-check 2 (post-delete text) failed" % rel)

    return base, new, {"cjk_before": nj(text), "cjk_after": nj(new),
                       "blocks": len(placed)}


def main(argv):
    mode = "apply" if "--apply" in argv else "dry"
    d = json.load(io.open(SITES, encoding="utf-8"))
    by_path = {}
    for k in ("deletes", "leads", "refills"):
        for s in d[k]:
            by_path.setdefault(s["path"], {"deletes": [], "leads": [],
                                           "refills": []})[k].append(s)

    prepared, failures = [], []
    for rel in sorted(by_path):
        p = os.path.join(ROOT, rel.replace("/", os.sep))
        with io.open(p, "rb") as fh:
            raw = fh.read()
        bom = raw.startswith(b"\xef\xbb\xbf")
        body = raw[3:] if bom else raw
        if b"\r" in body:
            failures.append("%s: CR in source" % rel)
            continue
        text = body.decode("utf-8")
        spec = dict(by_path[rel]); spec["rel"] = rel
        try:
            base, new, info = plan_file(spec, text)
        except Abort as e:
            failures.append(str(e))
            continue
        prepared.append({"rel": rel, "raw": raw, "bom": bom, "text": text,
                         "new": new, "info": info})

    if failures:
        print("ABORT — %d failure(s):" % len(failures))
        for f in failures:
            print("  " + f)
        return 1

    delta = {}
    for p in prepared:
        delta[p["rel"]] = p["info"]["cjk_after"] - p["info"]["cjk_before"]

    # ---- library-wide floor check against the PROJECTED text ---------------
    touched = {p["rel"]: p for p in prepared}
    lib_before = lib_after = 0
    min_after = None
    sub = []
    for n in range(1, 1001):
        rel = path_of(n)
        if rel in touched:
            before = touched[rel]["info"]["cjk_before"]
            after = touched[rel]["info"]["cjk_after"]
        else:
            with io.open(os.path.join(ROOT, rel.replace("/", os.sep)), "rb") as fh:
                raw = fh.read()
            body = raw[3:] if raw.startswith(b"\xef\xbb\xbf") else raw
            before = after = nj(body.decode("utf-8"))
        lib_before += before
        lib_after += after
        if min_after is None or after < min_after:
            min_after = after
        if after < FLOOR:
            sub.append((n, after))
    if sub:
        print("ABORT — projected floor breach: %s" % sub)
        return 1

    print("R297 %s — %d chapters" % (mode, len(prepared)))
    print("  delete lines removed %d / lead repairs %d / coda blocks %d"
          % (sum(2 if s["nl"] else 1 for s in d["deletes"]), len(d["leads"]),
             len(d["refills"])))
    print("  library %d -> %d  (%+d)" % (lib_before, lib_after, lib_after - lib_before))
    print("  min chapter after: %d" % min_after)
    for p in prepared:
        print("    %-52s %5d -> %5d  (%+d)%s"
              % (p["rel"].replace("chapters/", ""), p["info"]["cjk_before"],
                 p["info"]["cjk_after"], delta[p["rel"]],
                 "  +coda" if p["info"]["blocks"] else ""))

    if mode != "apply":
        return 0

    for p in prepared:
        raw = (b"\xef\xbb\xbf" if p["bom"] else b"") + p["new"].encode("utf-8")
        if raw[-1:] != p["raw"][-1:]:
            print("ABORT tail byte changed for %s" % p["rel"])
            return 1
        with io.open(os.path.join(ROOT, p["rel"].replace("/", os.sep)), "wb") as fh:
            fh.write(raw)
    print("APPLIED %d files" % len(prepared))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
