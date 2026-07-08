import json
import subprocess
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def glossary_content_js_path() -> Path:
    return repo_root() / "frontend" / "src" / "glossary" / "glossaryContent.js"


def export_glossary_entries_script() -> Path:
    return repo_root() / "backend" / "scripts" / "export_glossary_entries.mjs"


def load_glossary_entries(source_path: Path | None = None) -> list[dict]:
    glossary_path = source_path or glossary_content_js_path()
    script_path = export_glossary_entries_script()
    if not glossary_path.is_file():
        raise FileNotFoundError(f"Glossary source not found: {glossary_path}")
    if not script_path.is_file():
        raise FileNotFoundError(f"Glossary export script not found: {script_path}")

    result = subprocess.run(
        ["node", str(script_path), str(glossary_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip() or "Unknown error"
        raise RuntimeError(f"Failed to read glossaryContent.js: {message}")

    entries = json.loads(result.stdout)
    if not isinstance(entries, list):
        raise ValueError("GLOSSARY_ENTRIES must be an array.")
    return entries
