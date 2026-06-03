from __future__ import annotations

import ast
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

ROOT = Path(__file__).resolve().parents[2]
WIKI_DIR = ROOT / "wiki"
OUTPUT_PATH = WIKI_DIR / "data" / "wiki-data.json"

SOURCE_FILES = [
    "client/data/ItemData.gd",
    "client/data/SkillData.gd",
    "client/data/QuestData.gd",
    "client/data/AdventurerData.gd",
    "client/data/TaskData.gd",
    "client/data/FactionData.gd",
    "client/data/BossDungeonData.gd",
    "client/data/PatchNotesData.gd",
    "client/data/BuildInfo.gd",
    "client/data/AchievementData.gd",
    "client/data/TitleData.gd",
    "client/data/MilestoneData.gd",
    "client/data/AutoPassiveData.gd",
    "client/data/SkillTreeData.gd",
    "client/autoload/GameState.gd",
]

SPECIAL_BLOCKS = {
    "client/autoload/GameState.gd": [
        "_monster_defs_data",
        "_shadow_target_defs_data",
    ],
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def remove_comments(text: str) -> str:
    result: List[str] = []
    in_string = False
    string_char = ""
    escaped = False
    in_comment = False
    for char in text:
        if in_comment:
            if char == "\n":
                in_comment = False
                result.append(char)
            continue
        if in_string:
            result.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == string_char:
                in_string = False
            continue
        if char in {'"', "'"}:
            in_string = True
            string_char = char
            result.append(char)
            continue
        if char == "#":
            in_comment = True
            continue
        result.append(char)
    return "".join(result)


def color_to_hex(match: re.Match[str]) -> str:
    parts = [part.strip() for part in match.group(1).split(",")]
    floats = []
    for part in parts[:4]:
        try:
            floats.append(float(part))
        except ValueError:
            return repr(f"Color({match.group(1)})")
    while len(floats) < 3:
        floats.append(0.0)
    red = max(0, min(255, round(floats[0] * 255)))
    green = max(0, min(255, round(floats[1] * 255)))
    blue = max(0, min(255, round(floats[2] * 255)))
    return repr(f"#{red:02x}{green:02x}{blue:02x}")


def normalize_expression(expr: str) -> str:
    expr = remove_comments(expr).strip()
    expr = re.sub(r"\bnull\b", "None", expr)
    expr = re.sub(r"\btrue\b", "True", expr, flags=re.IGNORECASE)
    expr = re.sub(r"\bfalse\b", "False", expr, flags=re.IGNORECASE)
    expr = re.sub(r"Color\(([^()]+)\)", color_to_hex, expr)
    expr = re.sub(
        r"\b([A-Z][A-Za-z0-9_]*)\(([^()]*?)\)",
        lambda match: repr(f"{match.group(1)}({match.group(2)})"),
        expr,
    )
    return expr


_ARITHMETIC_NODES = (
    ast.Expression,
    ast.BinOp,
    ast.UnaryOp,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.FloorDiv,
    ast.Mod,
    ast.Pow,
    ast.USub,
    ast.UAdd,
    ast.Constant,
)


def eval_arithmetic(expr: str) -> Any:
    """Evaluate a constant numeric expression like ``4 * 60 * 60``.

    Returns ``None`` for anything that is not a pure number-and-operator
    expression so callers can fall back to keeping the raw string.
    """
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError:
        return None
    for node in ast.walk(tree):
        if not isinstance(node, _ARITHMETIC_NODES):
            return None
        if isinstance(node, ast.Constant) and not isinstance(node.value, (int, float)):
            return None
    try:
        return eval(compile(tree, "<arithmetic>", "eval"), {"__builtins__": {}}, {})
    except Exception:
        return None


def parse_literal(expr: str) -> Any:
    normalized = normalize_expression(expr)
    try:
        return ast.literal_eval(normalized)
    except Exception:
        pass
    arithmetic = eval_arithmetic(normalized)
    if arithmetic is not None:
        return arithmetic
    return normalized.strip()


def find_matching_brace(text: str, start_index: int) -> int:
    opening = text[start_index]
    closing = {"[": "]", "{" : "}", "(": ")"}[opening]
    depth = 0
    in_string = False
    string_char = ""
    escaped = False
    comment = False
    for index in range(start_index, len(text)):
        char = text[index]
        if comment:
            if char == "\n":
                comment = False
            continue
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == string_char:
                in_string = False
            continue
        if char == "#":
            comment = True
            continue
        if char in {'"', "'"}:
            in_string = True
            string_char = char
            continue
        if char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            if depth == 0:
                return index
    raise ValueError(f"Unbalanced expression starting at {start_index}")


def extract_assignment(text: str, needle: str) -> str | None:
    pattern = rf"{re.escape(needle)}(?:\s*:\s*[^=\n]+)?\s*=\s*"
    matches = list(re.finditer(pattern, text))
    if not matches:
        return None
    match = matches[-1]
    start = match.end()
    while start < len(text) and text[start].isspace():
        start += 1
    if start >= len(text):
        return None
    if text[start] in "[{(":
        end = find_matching_brace(text, start)
        return text[start : end + 1]
    line_end = text.find("\n", start)
    if line_end == -1:
        line_end = len(text)
    return text[start:line_end].strip()


def parse_consts(text: str) -> Dict[str, Any]:
    consts: Dict[str, Any] = {}
    for match in re.finditer(r"^\s*const\s+([A-Za-z0-9_]+)\b.*?=\s*", text, flags=re.MULTILINE):
        name = match.group(1)
        start = match.end()
        while start < len(text) and text[start].isspace():
            start += 1
        if start >= len(text):
            continue
        if text[start] in "[{(":
            end = find_matching_brace(text, start)
            expr = text[start : end + 1]
        else:
            line_end = text.find("\n", start)
            if line_end == -1:
                line_end = len(text)
            expr = text[start:line_end].strip()
        consts[name] = parse_literal(expr)
    return consts


def parse_special_blocks(text: str, block_names: Iterable[str]) -> Dict[str, Any]:
    blocks: Dict[str, Any] = {}
    for name in block_names:
        expr = extract_assignment(text, name)
        if expr is None:
            continue
        blocks[name] = parse_literal(expr)
    return blocks


def file_payload(relative_path: str) -> Dict[str, Any]:
    text = read_text(ROOT / relative_path)
    consts = parse_consts(text)
    specials = parse_special_blocks(text, SPECIAL_BLOCKS.get(relative_path, []))
    return {
        "consts": consts,
        "specials": specials,
    }


def _is_unbuilt_release(entry: Any) -> bool:
    """A patch-notes entry no build has stamped yet (placeholder version
    'x.x.x' or version_code 0). These must not surface on the public wiki."""
    if not isinstance(entry, dict):
        return False
    if str(entry.get("version", "")).strip().lower() in ("x.x.x", ""):
        return True
    try:
        return int(entry.get("version_code", 0)) == 0
    except (TypeError, ValueError):
        return False


def _drop_unbuilt_patch_notes(data: Dict[str, Any]) -> None:
    payload = data.get("sources", {}).get("client/data/PatchNotesData.gd")
    if not isinstance(payload, dict):
        return
    consts = payload.get("consts")
    if not isinstance(consts, dict):
        return
    releases = consts.get("RELEASES")
    if isinstance(releases, list):
        consts["RELEASES"] = [r for r in releases if not _is_unbuilt_release(r)]


def main() -> None:
    data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sources": {},
    }
    for relative_path in SOURCE_FILES:
        data["sources"][relative_path] = file_payload(relative_path)
    _drop_unbuilt_patch_notes(data)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=True, sort_keys=True), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
