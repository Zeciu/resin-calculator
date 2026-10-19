"""The Docker frontend stage must copy every local file vite.config.js imports."""

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
DOCKERFILE = REPO_ROOT / "deployment" / "Dockerfile"
VITE_CONFIG = REPO_ROOT / "frontend" / "vite.config.js"


def test_dockerfile_copies_local_modules_imported_by_vite_config() -> None:
    config_source = VITE_CONFIG.read_text(encoding="utf-8")
    local_imports = re.findall(r'^import .* from "\./([^"]+)";', config_source, re.MULTILINE)
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    copied = set(re.findall(r"frontend/([\w.\-/]+)", dockerfile))

    for module in local_imports:
        assert module in copied, f"Dockerfile must COPY frontend/{module} (imported by vite.config.js)"
