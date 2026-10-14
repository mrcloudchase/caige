#!/usr/bin/env python3
"""Syntax-check fenced code blocks in Markdown content.

Every ```python block must parse with ast.parse and every ```json block must
be valid JSON. Use ```text for pseudocode or diagrams.

Usage: python3 -I scripts/check-code-blocks.py [paths...]
Defaults to src/content and lab/labs.
"""
import ast
import json
import pathlib
import re
import sys

FENCE = re.compile(r"^```(\w+)?[^\n]*\n(.*?)^```", re.M | re.S)


def check_file(path: pathlib.Path) -> list[str]:
    errors = []
    text = path.read_text(encoding="utf-8")
    for m in FENCE.finditer(text):
        lang = (m.group(1) or "").lower()
        body = m.group(2)
        line = text.count("\n", 0, m.start()) + 1
        if lang in ("python", "py"):
            try:
                ast.parse(body)
            except SyntaxError as e:
                errors.append(f"{path}:{line + (e.lineno or 0)}: python syntax error: {e.msg}")
        elif lang == "json":
            try:
                json.loads(body)
            except json.JSONDecodeError as e:
                errors.append(f"{path}:{line + e.lineno}: invalid json: {e.msg}")
    return errors


def main(argv: list[str]) -> int:
    roots = [pathlib.Path(p) for p in argv] or [pathlib.Path("src/content"), pathlib.Path("lab/labs")]
    files = []
    for root in roots:
        if root.is_file():
            files.append(root)
        elif root.is_dir():
            files.extend(sorted(root.rglob("*.md")))
    errors = [e for f in files for e in check_file(f)]
    for e in errors:
        print(e)
    print(f"checked {len(files)} files, {len(errors)} code block error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
