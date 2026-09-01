"""Content-corpus selection: local editorial preview vs packaged production."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from public.content_corpus import (
    EDITORIAL_PUBLISHED,
    PACKAGED_PUBLIC,
    aws_runtime_detected,
    resolve_content_corpus,
)


def test_aws_execution_env_is_detected(monkeypatch):
    monkeypatch.setenv("AWS_EXECUTION_ENV", "AWS_ECS_FARGATE")
    assert aws_runtime_detected() is True


def test_ecs_metadata_uri_is_detected(monkeypatch):
    monkeypatch.delenv("AWS_EXECUTION_ENV", raising=False)
    monkeypatch.setenv("ECS_CONTAINER_METADATA_URI_V4", "http://169.254.170.2/v4")
    assert aws_runtime_detected() is True


def test_local_dev_is_not_an_aws_runtime(monkeypatch):
    monkeypatch.delenv("AWS_EXECUTION_ENV", raising=False)
    monkeypatch.delenv("ECS_CONTAINER_METADATA_URI", raising=False)
    monkeypatch.delenv("ECS_CONTAINER_METADATA_URI_V4", raising=False)
    assert aws_runtime_detected() is False


def test_aws_runtime_cannot_select_editorial_store(monkeypatch):
    monkeypatch.setenv("AWS_EXECUTION_ENV", "AWS_ECS_FARGATE")
    monkeypatch.setattr(
        "public.content_corpus.local_editorial_package_importable",
        lambda: True,
    )
    assert resolve_content_corpus() == PACKAGED_PUBLIC


def test_local_private_source_selects_editorial_preview(monkeypatch):
    monkeypatch.delenv("AWS_EXECUTION_ENV", raising=False)
    monkeypatch.delenv("ECS_CONTAINER_METADATA_URI", raising=False)
    monkeypatch.delenv("ECS_CONTAINER_METADATA_URI_V4", raising=False)
    monkeypatch.setattr(
        "public.content_corpus.local_editorial_package_importable",
        lambda: True,
    )
    assert resolve_content_corpus() == EDITORIAL_PUBLISHED


def test_missing_private_source_selects_packaged_corpus(monkeypatch):
    monkeypatch.delenv("AWS_EXECUTION_ENV", raising=False)
    monkeypatch.delenv("ECS_CONTAINER_METADATA_URI", raising=False)
    monkeypatch.delenv("ECS_CONTAINER_METADATA_URI_V4", raising=False)
    monkeypatch.setattr(
        "public.content_corpus.local_editorial_package_importable",
        lambda: False,
    )
    assert resolve_content_corpus() == PACKAGED_PUBLIC


def test_dockerfile_does_not_copy_private_editorial_tree():
    dockerfile = Path(__file__).resolve().parents[3] / "deployment" / "Dockerfile"
    source = dockerfile.read_text(encoding="utf-8")
    assert "COPY backend/public ./public" in source
    assert "COPY backend/private" not in source
    assert "backend/private" in source


def test_content_corpus_probe_has_no_static_private_import():
    source = (Path(__file__).resolve().parents[2] / "public" / "content_corpus.py").read_text(
        encoding="utf-8"
    )
    assert "importlib.import_module" in source
    assert not any(
        line.strip().startswith(("import private", "from private"))
        for line in source.splitlines()
    )


def test_packaged_public_languages_exist():
    """Sanity: production corpus config is present for packaged reader tests."""
    path = (
        Path(__file__).resolve().parents[2]
        / "public"
        / "content"
        / "config"
        / "public-languages.json"
    )
    payload = json.loads(path.read_text(encoding="utf-8"))
    assert payload["activePublicLocales"] == ["en", "ro"]
    assert "fr" not in payload["activePublicLocales"]
