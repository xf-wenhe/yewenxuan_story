#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R271 -- normalise working-tree line endings to LF.

`.gitattributes` declares `* text=auto eol=lf` and every blob in the index is
already LF, but ~470 working-tree files carry CRLF -- the scripts that wrote
them opened them in text mode on Windows.  The drift is not a content defect,
but it costs a `CRLF will be replaced by LF` warning on every `git add`, it
makes a blob-vs-worktree byte comparison report `0 -> N` CR for files this
round never touched (R270's false alarm), and `git checkout` silently rewrites
it -- R269 lost 41 hand-restored files that way.

This round rewrites `\r\n` to `\n` in every tracked file git reports as
`w/crlf` or `w/mixed`.  Nothing else changes:

  * a lone `\\r` (one not followed by `\\n`) is left alone and counted, since
    it is content, not a line ending;
  * a UTF-8 BOM is neither added nor removed.  Seven tracked files carry one
    (the characters roster, two tool outputs, four work notes); the project
    rule freezes BOM state, so the round records each file's BOM flag at dry
    time and asserts it again at verify time.

Because every blob is LF, the post-condition is exact and strong: after the
round `git status` must still report a clean tree, i.e. the rewrite changed no
committed content at all, and every touched file is byte-identical to its HEAD
blob.  Getting there needs one extra step: the index keeps the pre-rewrite
size, and `ce_modified_check_fs()` treats a size mismatch as DATA_CHANGED
without hashing the file, so `git status` calls all 471 modified even though
`git diff` is empty.  `apply` therefore ends with `git add --renormalize .`
and asserts that it staged nothing.

Usage:
    python tools/fix_r271_eol.py --dry
    python tools/fix_r271_eol.py --apply
    python tools/fix_r271_eol.py --verify
"""

import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, "tools", "r271_eol_sites.json")
BOM = b"\xef\xbb\xbf"


def git(*args):
    return subprocess.run(("git",) + args, cwd=ROOT,
                          capture_output=True, check=True).stdout


def read_bytes(rel):
    with open(os.path.join(ROOT, rel), "rb") as fh:
        return fh.read()


def blob_bytes(rel):
    return git("cat-file", "blob", "HEAD:" + rel)


def counts(data):
    crlf = data.count(b"\r\n")
    lf = data.count(b"\n") - crlf
    lone_cr = data.count(b"\r") - crlf
    return crlf, lf, lone_cr


def cjk(data):
    return sum(1 for ch in data.decode("utf-8") if "一" <= ch <= "鿿")


def survey():
    """Every tracked file whose working-tree copy is CRLF or mixed."""
    out = git("ls-files", "--eol").decode("utf-8")
    rows = []
    for line in out.splitlines():
        if "\t" not in line:
            continue
        head, path = line.split("\t", 1)
        fields = head.split()
        if len(fields) < 2:
            continue
        if fields[1] in ("w/crlf", "w/mixed"):
            rows.append((path, fields[0], fields[1]))
    return rows


def build():
    """The site table: one record per drifted file."""
    table = []
    for rel, index_eol, work_eol in survey():
        data = read_bytes(rel)
        crlf, lf, lone_cr = counts(data)
        table.append({
            "path": rel,
            "index_eol": index_eol,
            "work_eol": work_eol,
            "bom": data.startswith(BOM),
            "crlf": crlf,
            "lf": lf,
            "lone_cr": lone_cr,
            "cjk": cjk(data),
            "size": len(data),
            "blob_size": len(blob_bytes(rel)),
        })
    table.sort(key=lambda r: r["path"])
    return table


def save(table):
    with open(SITES, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(table, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def load():
    with open(SITES, encoding="utf-8") as fh:
        return json.load(fh)


def summary(table):
    print("files to normalise: %d" % len(table))
    print("  CRLF total      : %d" % sum(r["crlf"] for r in table))
    print("  lone CR (kept)  : %d" % sum(r["lone_cr"] for r in table))
    print("  CJK total       : %d" % sum(r["cjk"] for r in table))
    vol = {}
    for r in table:
        key = r["path"].split("/")[0] if "/" in r["path"] else "(repo root)"
        if r["path"].startswith("chapters/"):
            key = "/".join(r["path"].split("/")[:2])
        vol[key] = vol.get(key, 0) + 1
    for key in sorted(vol):
        print("  %-24s %d" % (key, vol[key]))


def dry(table):
    summary(table)
    for r in table[:5]:
        print("  e.g. %s  CRLF=%d size %d -> %d"
              % (r["path"], r["crlf"], r["size"], r["blob_size"]))
    bad = [r["path"] for r in table if r["size"] - r["blob_size"] != r["crlf"]]
    if bad:
        print("NOTE: %d file(s) whose size delta is not exactly the CR count:"
              % len(bad))
        for rel in bad[:20]:
            print("  %s" % rel)


def apply(table):
    changed = 0
    for rec in table:
        rel = rec["path"]
        data = read_bytes(rel)
        new = data.replace(b"\r\n", b"\n")
        if new == data:
            continue
        with open(os.path.join(ROOT, rel), "wb") as fh:
            fh.write(new)
        changed += 1
    print("apply: rewrote %d of %d file(s)" % (changed, len(table)))

    # The index still caches the pre-rewrite size, and ce_modified_check_fs()
    # treats a size mismatch as DATA_CHANGED without ever hashing the file --
    # so `git status` reports all 471 as modified while `git diff` is empty and
    # `git hash-object --path` already equals the blob.  Renormalising re-runs
    # the clean filter and refreshes the stat cache; since every blob is LF,
    # no blob can change, and we assert that rather than assume it.
    subprocess.run(("git", "add", "--renormalize", "."), cwd=ROOT, check=True)
    staged = git("diff", "--cached", "--stat").decode("utf-8").strip()
    if staged:
        raise SystemExit("ABORT: renormalising changed committed content:\n"
                         + staged)
    print("apply: index renormalised, no blob changed")


def verify(table):
    """Replay against the HEAD blob: the rewrite must reproduce it exactly."""
    bad = []
    for rec in table:
        rel = rec["path"]
        data = read_bytes(rel)
        crlf, lf, lone_cr = counts(data)
        if data.startswith(BOM) != rec["bom"]:
            raise SystemExit("ABORT: %s changed its BOM state" % rel)
        if lone_cr != rec["lone_cr"]:
            raise SystemExit("ABORT: %s changed its lone-CR count %d -> %d"
                             % (rel, rec["lone_cr"], lone_cr))
        if crlf:
            raise SystemExit("ABORT: %s still holds %d CRLF" % (rel, crlf))
        blob = blob_bytes(rel)
        if data == blob:
            continue
        bad.append((rel, len(data), len(blob), crlf, lone_cr))
    print("verify: %d/%d file(s) now byte-identical to their HEAD blob"
          % (len(table) - len(bad), len(table)))
    for rel, size, bsize, crlf, lone_cr in bad[:20]:
        print("  MISMATCH %s size %d vs blob %d (crlf=%d lone_cr=%d)"
              % (rel, size, bsize, crlf, lone_cr))
    if bad:
        raise SystemExit("ABORT: %d file(s) did not replay" % len(bad))

    status = git("status", "--porcelain").decode("utf-8")
    stray = [ln for ln in status.splitlines() if not ln.startswith("??")]
    print("verify: git status lists %d tracked path(s) as modified" % len(stray))
    for ln in stray[:20]:
        print("  %s" % ln)
    if stray:
        raise SystemExit("ABORT: the rewrite changed committed content")
    print("verify: clean -- the round changed no committed content")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--dry"
    if mode == "--dry":
        table = build()
        save(table)
        dry(table)
    elif mode == "--apply":
        apply(load())
    elif mode == "--verify":
        verify(load())
    else:
        raise SystemExit("usage: fix_r271_eol.py --dry|--apply|--verify")


if __name__ == "__main__":
    main()
