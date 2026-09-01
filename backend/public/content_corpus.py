"""Which published snapshot tree /api/content reads.

Local workstations with ``backend/private`` preview published editorial
snapshots so translations can be checked before packaging. Production — AWS
runtimes, and any image that omits ``backend/private`` — always reads the
packaged corpus under ``backend/public/content``. Drafts are never served.
"""

from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import FastAPI

CONTENT_CORPUS_HEADER = "X-HFZWood-Content-Corpus"
EDITORIAL_PUBLISHED = "editorial-published"
PACKAGED_PUBLIC = "packaged-public"

_logger = logging.getLogger(__name__)


def aws_runtime_detected() -> bool:
    """True when the process is an AWS/ECS task, never a local ``./dev.cmd`` run."""
    return bool(
        os.environ.get("AWS_EXECUTION_ENV", "").strip()
        or os.environ.get("ECS_CONTAINER_METADATA_URI", "").strip()
        or os.environ.get("ECS_CONTAINER_METADATA_URI_V4", "").strip()
    )


def local_editorial_package_importable() -> bool:
    try:
        import importlib

        importlib.import_module("private.routers.public_content")
    except ImportError:
        return False
    return True


def resolve_content_corpus() -> str:
    """Return the content corpus id for this process.

    AWS runtimes cannot select the editorial store, even if private source
    were copied into the image by mistake. Local processes with editorial
    source preview published private snapshots. Everyone else uses packaged
    public content.
    """
    if aws_runtime_detected():
        return PACKAGED_PUBLIC
    if local_editorial_package_importable():
        return EDITORIAL_PUBLISHED
    return PACKAGED_PUBLIC


def install_content_corpus_header(app: FastAPI, corpus: str) -> None:
    """Advertise the selected corpus on /api/content responses."""
    from fastapi import Request

    app.state.content_corpus = corpus

    @app.middleware("http")
    async def content_corpus_header_middleware(request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/api/content"):
            response.headers[CONTENT_CORPUS_HEADER] = corpus
        return response

    _logger.warning("HFZWood /api/content corpus: %s", corpus)
