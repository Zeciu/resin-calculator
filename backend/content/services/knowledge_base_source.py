import json
import subprocess
from pathlib import Path


def seed_data_path() -> Path:
    return Path(__file__).resolve().parents[2] / "seed-data" / "knowledge-base-entries.json"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def knowledge_base_content_js_path() -> Path:
    return repo_root() / "frontend" / "src" / "knowledgeBase" / "knowledgeBaseContent.js"


def export_knowledge_base_entries_script() -> Path:
    return repo_root() / "backend" / "scripts" / "export_knowledge_base_entries.mjs"


def load_knowledge_base_entries(source_path: Path | None = None) -> list[dict]:
    if source_path is None and seed_data_path().is_file():
        entries = json.loads(seed_data_path().read_text(encoding="utf-8"))
        if not isinstance(entries, list):
            raise ValueError("KNOWLEDGE_BASE_ENTRIES must be an array.")
        return entries

    kb_path = source_path or knowledge_base_content_js_path()
    script_path = export_knowledge_base_entries_script()
    if not kb_path.is_file():
        raise FileNotFoundError(f"Knowledge Base source not found: {kb_path}")
    if not script_path.is_file():
        raise FileNotFoundError(f"Knowledge Base export script not found: {script_path}")

    result = subprocess.run(
        ["node", str(script_path), str(kb_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip() or "Unknown error"
        raise RuntimeError(f"Failed to read knowledgeBaseContent.js: {message}")

    entries = json.loads(result.stdout)
    if not isinstance(entries, list):
        raise ValueError("KNOWLEDGE_BASE_ENTRIES must be an array.")
    return entries
