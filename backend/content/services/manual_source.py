import json
import subprocess
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def manual_content_js_path() -> Path:
    return repo_root() / "frontend" / "src" / "manual" / "manualContent.js"


def export_manual_sections_script() -> Path:
    return repo_root() / "backend" / "scripts" / "export_manual_sections.mjs"


def load_manual_sections(source_path: Path | None = None) -> list[dict]:
    manual_path = source_path or manual_content_js_path()
    script_path = export_manual_sections_script()
    if not manual_path.is_file():
        raise FileNotFoundError(f"Manual source not found: {manual_path}")
    if not script_path.is_file():
        raise FileNotFoundError(f"Manual export script not found: {script_path}")

    result = subprocess.run(
        ["node", str(script_path), str(manual_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip() or "Unknown error"
        raise RuntimeError(f"Failed to read manualContent.js: {message}")

    sections = json.loads(result.stdout)
    if not isinstance(sections, list):
        raise ValueError("MANUAL_SECTIONS must be an array.")
    return sections
