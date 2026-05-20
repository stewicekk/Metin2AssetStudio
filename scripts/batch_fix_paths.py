#!/usr/bin/env python3
# scripts/batch_fix_paths.py
# Standalone batch script: Fix texture paths in GR2 files
# Usage: python scripts/batch_fix_paths.py <folder> [--asset-root D:/ymir work]
# ============================================================================

import sys
import os
import argparse

# Ensure parent directory is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from gr2_parser import GR2Parser, PathFixer


def main():
    parser = argparse.ArgumentParser(
        description="Batch-fix Metin2 GR2 texture paths"
    )
    parser.add_argument("folder", help="Folder containing .gr2 files")
    parser.add_argument(
        "--asset-root",
        default="D:/ymir work",
        help="Asset root directory (default: D:/ymir work)",
    )
    parser.add_argument(
        "--recursive", "-r",
        action="store_true",
        help="Search recursively",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show changes without writing files",
    )
    args = parser.parse_args()

    folder = args.folder
    if not os.path.isdir(folder):
        print(f"ERROR: '{folder}' is not a valid directory.", file=sys.stderr)
        sys.exit(1)

    # Collect GR2 files
    gr2_files = []
    if args.recursive:
        for root, _, files in os.walk(folder):
            for fn in files:
                if fn.lower().endswith(".gr2"):
                    gr2_files.append(os.path.join(root, fn))
    else:
        gr2_files = [
            os.path.join(folder, fn)
            for fn in os.listdir(folder)
            if fn.lower().endswith(".gr2")
        ]

    if not gr2_files:
        print("No .gr2 files found.")
        return

    print(f"Found {len(gr2_files)} GR2 file(s). Processing…\n")

    fixer  = PathFixer(args.asset_root)
    gr2_parser = GR2Parser(args.asset_root)
    fixed_total = 0

    for fp in gr2_files:
        gr2 = gr2_parser.parse(fp)
        if not gr2.is_valid:
            print(f"  SKIP  {os.path.basename(fp)} — {gr2.error_message}")
            continue

        changes = []
        for mat in gr2.materials:
            orig = mat.texture_path
            fixed = fixer.fix_texture_path(orig)
            if fixed != orig:
                mat.texture_path = fixed
                changes.append(f"    {orig!r:50s}  →  {fixed!r}")

        if changes:
            fixed_total += len(changes)
            print(f"  FIX   {os.path.basename(fp)}")
            for c in changes:
                print(c)
            if not args.dry_run:
                gr2_parser.write(gr2, fp)
        else:
            print(f"  OK    {os.path.basename(fp)}")

    print(f"\nDone. {fixed_total} path(s) fixed across {len(gr2_files)} file(s).")
    if args.dry_run:
        print("(Dry run — no files were modified.)")


if __name__ == "__main__":
    main()
