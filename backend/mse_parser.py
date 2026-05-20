import re
from typing import Any


def _find_matching_brace(text: str, start: int) -> int:
    depth = 1
    i = start
    while i < len(text) and depth > 0:
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
        i += 1
    return i


def _extract_value(line: str) -> str | None:
    m = re.search(r'"([^"]*)"', line)
    if m:
        return m.group(1)
    return None


def _parse_blocks(text: str, parent_name: str = "") -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    pos = 0

    while pos < len(text):
        brace = text.find('{', pos)
        if brace < 0:
            break

        before = text[max(pos, brace - 60):brace].strip().split('\n')[-1]
        content, pos = text[brace + 1:_find_matching_brace(text, brace + 1)], _find_matching_brace(text, brace + 1)
        before = before.rstrip('{').strip()

        name = before if before else parent_name
        children = _parse_blocks(content, name)

        entry: dict[str, Any] = {"name": name}
        if children:
            entry["children"] = children
        blocks.append(entry)

    return blocks


def parse_mse(text: str) -> dict[str, Any]:
    blocks = _parse_blocks(text)

    result: dict[str, Any] = {"groups": []}

    radius_match = re.search(r"BoundingSphereRadius\s+([\d.]+)", text)
    if radius_match:
        result["radius"] = radius_match.group(1)

    pos_match = re.search(r"BoundingSpherePosition\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)", text)
    if pos_match:
        result["pos"] = [pos_match.group(1), pos_match.group(2), pos_match.group(3)]

    deps: list[dict[str, str]] = []

    def _walk(items: list[dict[str, Any]]) -> None:
        for item in items:
            name = item.get("name", "").strip().lower()
            if "group particle" in name:
                result["groups"].append(item)
            _walk(item.get("children", []))

    def _find_deps(items: list[dict[str, Any]], text: str) -> None:
        all_lines = text.split('\n')
        for line in all_lines:
            if "ParticleEffectFile" in line:
                val = _extract_value(line)
                if val:
                    deps.append({"path": val})

    _walk(blocks)
    _find_deps(blocks, text)
    result["dependencies"] = deps
    return result


def validate_mse(text: str) -> list[str]:
    issues: list[str] = []
    if not text.strip():
        issues.append("Empty file")
        return issues
    if "BoundingSphereRadius" not in text:
        issues.append("Missing BoundingSphereRadius")
    brace_count = text.count('{') - text.count('}')
    if brace_count != 0:
        issues.append(f"Unbalanced braces ({brace_count})")
    groups = re.findall(r'Group\s+Particle', text, re.IGNORECASE)
    if not groups:
        issues.append("No particle groups found")
    return issues
