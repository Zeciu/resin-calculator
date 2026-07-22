"""Bulk translation update orchestration over TranslationUpdateService (Task B)."""

from __future__ import annotations

import threading
from dataclasses import dataclass
from typing import Any, Literal

from content.schemas.common import parse_admin_locale
from content.services.editorial_identity import (
    chapter_identity_title,
    entry_identity_term,
    entry_identity_title,
)
from content.services.website_pages import resolve_public_title
from content.services.translation_update import (
    GenerateModule,
    OverwriteConfirmationRequired,
    TranslationUpdateAction,
    TranslationUpdateError,
    TranslationUpdateService,
    TranslationUpdateState,
)
from content.translation.exceptions import TranslationError
from content.translation.provider import TranslationProvider
from content.translation_metadata import CANONICAL_SOURCE_LOCALE

DEFAULT_BULK_CHUNK_SIZE = 5
MAX_BULK_CHUNK_SIZE = 20

BulkItemStatus = Literal["completed", "skipped", "failed"]


@dataclass
class BulkItemPlan:
    content_id: str
    label: str
    state: TranslationUpdateState
    planned_action: str
    invalid: bool = False


@dataclass
class BulkItemResult:
    content_id: str
    label: str
    initial_state: str
    action: str
    final_state: str | None
    status: BulkItemStatus
    provider_called: bool
    error: str | None = None


@dataclass
class BulkCounts:
    missing: int = 0
    current: int = 0
    media_only_outdated: int = 0
    text_outdated: int = 0
    manual_untracked: int = 0
    invalid: int = 0

    def as_dict(self) -> dict[str, int]:
        return {
            "missing": self.missing,
            "current": self.current,
            "mediaOnlyOutdated": self.media_only_outdated,
            "textOutdated": self.text_outdated,
            "manualUntracked": self.manual_untracked,
            "invalid": self.invalid,
        }


@dataclass
class BulkSummary:
    total: int = 0
    generated: int = 0
    media_synced: int = 0
    skipped_current: int = 0
    skipped_text_outdated: int = 0
    skipped_manual_untracked: int = 0
    skipped_invalid: int = 0
    failed: int = 0
    provider_calls: int = 0

    def as_dict(self) -> dict[str, int]:
        return {
            "total": self.total,
            "generated": self.generated,
            "mediaSynced": self.media_synced,
            "skippedCurrent": self.skipped_current,
            "skippedTextOutdated": self.skipped_text_outdated,
            "skippedManualUntracked": self.skipped_manual_untracked,
            "skippedInvalid": self.skipped_invalid,
            "failed": self.failed,
            "providerCallItems": self.provider_calls,
        }

    def add_result(self, result: BulkItemResult) -> None:
        self.total += 1
        if result.status == "failed":
            self.failed += 1
            return
        if result.action == TranslationUpdateAction.GENERATE_FULL.value and result.status == "completed":
            self.generated += 1
            if result.provider_called:
                self.provider_calls += 1
            return
        if result.action == TranslationUpdateAction.SYNC_MEDIA_ONLY.value and result.status == "completed":
            self.media_synced += 1
            return
        if result.action == TranslationUpdateAction.SKIP_CURRENT.value:
            self.skipped_current += 1
            return
        if result.action == "skip_text_outdated":
            self.skipped_text_outdated += 1
            return
        if result.action == TranslationUpdateAction.SKIP_MANUAL_UNTRACKED.value:
            self.skipped_manual_untracked += 1
            return
        if result.action == "skip_invalid":
            self.skipped_invalid += 1


class BulkRunConflictError(Exception):
    def __init__(self, module: str, locale: str) -> None:
        super().__init__(
            f"A Generate All operation is already running for {module}/{locale}."
        )
        self.module = module
        self.locale = locale


_bulk_locks: dict[tuple[str, str], threading.Lock] = {}
_bulk_locks_guard = threading.Lock()
_active_runs: set[tuple[str, str]] = set()


def _run_key(module: str, locale: str) -> tuple[str, str]:
    return (module, locale)


def _acquire_bulk_run(module: str, locale: str) -> None:
    key = _run_key(module, locale)
    with _bulk_locks_guard:
        if key not in _bulk_locks:
            _bulk_locks[key] = threading.Lock()
        lock = _bulk_locks[key]
    if not lock.acquire(blocking=False):
        raise BulkRunConflictError(module, locale)
    with _bulk_locks_guard:
        if key in _active_runs:
            lock.release()
            raise BulkRunConflictError(module, locale)
        _active_runs.add(key)


def _release_bulk_run(module: str, locale: str) -> None:
    key = _run_key(module, locale)
    with _bulk_locks_guard:
        _active_runs.discard(key)
        lock = _bulk_locks.get(key)
    if lock is not None and lock.locked():
        lock.release()


def reset_bulk_run_locks_for_tests() -> None:
    """Test helper: clear process-local bulk locks."""
    with _bulk_locks_guard:
        _active_runs.clear()
        for lock in list(_bulk_locks.values()):
            if lock.locked():
                try:
                    lock.release()
                except RuntimeError:
                    pass
        _bulk_locks.clear()


class TranslationBulkService:
    """Enumerate + classify + chunked update using TranslationUpdateService only."""

    def __init__(
        self,
        repository,
        *,
        provider: TranslationProvider | None = None,
    ) -> None:
        self._repository = repository
        self._provider = provider
        self._updater = TranslationUpdateService(repository, provider=provider)

    def preview(
        self,
        *,
        module: GenerateModule,
        target_locale: str,
        include_text_outdated: bool = False,
    ) -> dict[str, Any]:
        parsed = self._validate_locale(target_locale)
        plans = self._plan_all(module, parsed, include_text_outdated=include_text_outdated)
        counts = BulkCounts()
        for plan in plans:
            if plan.invalid or plan.planned_action == "skip_invalid":
                counts.invalid += 1
            elif plan.state == TranslationUpdateState.MISSING:
                counts.missing += 1
            elif plan.state == TranslationUpdateState.CURRENT:
                counts.current += 1
            elif plan.state == TranslationUpdateState.MEDIA_ONLY_OUTDATED:
                counts.media_only_outdated += 1
            elif plan.state == TranslationUpdateState.TEXT_OUTDATED:
                counts.text_outdated += 1
            elif plan.state == TranslationUpdateState.MANUAL_UNTRACKED:
                counts.manual_untracked += 1
            else:
                counts.invalid += 1
        return {
            "module": module,
            "locale": parsed,
            "includeTextOutdated": include_text_outdated,
            "total": len(plans),
            "counts": counts.as_dict(),
            "items": [
                {
                    "contentId": p.content_id,
                    "label": p.label,
                    "state": "invalid" if p.invalid else p.state.value,
                    "plannedAction": p.planned_action,
                }
                for p in plans
            ],
        }

    def process_chunk(
        self,
        *,
        module: GenerateModule,
        target_locale: str,
        include_text_outdated: bool = False,
        offset: int = 0,
        limit: int = DEFAULT_BULK_CHUNK_SIZE,
    ) -> dict[str, Any]:
        parsed = self._validate_locale(target_locale)
        if offset < 0:
            raise TranslationUpdateError("offset must be >= 0.")
        chunk_limit = min(max(1, int(limit)), MAX_BULK_CHUNK_SIZE)

        _acquire_bulk_run(module, parsed)
        try:
            plans = self._plan_all(
                module, parsed, include_text_outdated=include_text_outdated
            )
            total = len(plans)
            chunk = plans[offset : offset + chunk_limit]
            results: list[BulkItemResult] = []
            summary = BulkSummary()

            for plan in chunk:
                result = self._execute_plan(module, parsed, plan, include_text_outdated)
                results.append(result)
                summary.add_result(result)

            next_offset = offset + len(chunk)
            done = next_offset >= total
            return {
                "module": module,
                "locale": parsed,
                "includeTextOutdated": include_text_outdated,
                "offset": offset,
                "limit": chunk_limit,
                "total": total,
                "nextOffset": None if done else next_offset,
                "done": done,
                "chunkSummary": summary.as_dict(),
                "items": [self._result_dict(r) for r in results],
            }
        finally:
            _release_bulk_run(module, parsed)

    def _validate_locale(self, target_locale: str) -> str:
        parsed = parse_admin_locale(target_locale)
        if parsed == CANONICAL_SOURCE_LOCALE:
            raise TranslationUpdateError(
                "Cannot run Generate All for the Romanian source locale."
            )
        return parsed

    def _content_ids(self, module: GenerateModule) -> list[str]:
        if module == "manual":
            return list(self._repository.list_manual_chapter_ids())
        if module == "glossary":
            return list(self._repository.list_glossary_entry_ids())
        if module == "website":
            return list(self._repository.list_website_page_ids())
        return list(self._repository.list_kb_entry_ids())

    def _label_for(self, module: GenerateModule, content_id: str) -> str:
        if module == "manual":
            return chapter_identity_title(self._repository, content_id) or content_id
        if module == "glossary":
            return entry_identity_term(self._repository, content_id) or content_id
        if module == "website":
            return resolve_public_title(self._repository, content_id, CANONICAL_SOURCE_LOCALE) or content_id
        return entry_identity_title(self._repository, content_id) or content_id

    def _planned_action(
        self,
        state: TranslationUpdateState,
        *,
        include_text_outdated: bool,
    ) -> str:
        if state == TranslationUpdateState.MISSING:
            return TranslationUpdateAction.GENERATE_FULL.value
        if state == TranslationUpdateState.CURRENT:
            return TranslationUpdateAction.SKIP_CURRENT.value
        if state == TranslationUpdateState.MEDIA_ONLY_OUTDATED:
            return TranslationUpdateAction.SYNC_MEDIA_ONLY.value
        if state == TranslationUpdateState.MANUAL_UNTRACKED:
            return TranslationUpdateAction.SKIP_MANUAL_UNTRACKED.value
        if state == TranslationUpdateState.TEXT_OUTDATED:
            if include_text_outdated:
                return TranslationUpdateAction.GENERATE_FULL.value
            return "skip_text_outdated"
        return "skip_invalid"

    def _plan_all(
        self,
        module: GenerateModule,
        locale: str,
        *,
        include_text_outdated: bool,
    ) -> list[BulkItemPlan]:
        plans: list[BulkItemPlan] = []
        for content_id in self._content_ids(module):
            label = self._label_for(module, content_id)
            try:
                ro_variant, _target, classification = self._updater.classify_item(
                    module=module,
                    content_id=content_id,
                    target_locale=locale,
                )
            except (TranslationUpdateError, KeyError, ValueError):
                plans.append(
                    BulkItemPlan(
                        content_id=content_id,
                        label=label,
                        state=TranslationUpdateState.MISSING,
                        planned_action="skip_invalid",
                        invalid=True,
                    )
                )
                continue

            if ro_variant is None or not isinstance(ro_variant.get("draftBody"), dict):
                plans.append(
                    BulkItemPlan(
                        content_id=content_id,
                        label=label,
                        state=TranslationUpdateState.MISSING,
                        planned_action="skip_invalid",
                        invalid=True,
                    )
                )
                continue

            plans.append(
                BulkItemPlan(
                    content_id=content_id,
                    label=label,
                    state=classification.state,
                    planned_action=self._planned_action(
                        classification.state,
                        include_text_outdated=include_text_outdated,
                    ),
                )
            )
        return plans

    def _execute_plan(
        self,
        module: GenerateModule,
        locale: str,
        plan: BulkItemPlan,
        include_text_outdated: bool,
    ) -> BulkItemResult:
        if plan.invalid or plan.planned_action == "skip_invalid":
            return BulkItemResult(
                content_id=plan.content_id,
                label=plan.label,
                initial_state="invalid",
                action="skip_invalid",
                final_state=None,
                status="skipped",
                provider_called=False,
                error="Romanian source variant is missing or invalid.",
            )

        if plan.planned_action == "skip_text_outdated":
            return BulkItemResult(
                content_id=plan.content_id,
                label=plan.label,
                initial_state=plan.state.value,
                action="skip_text_outdated",
                final_state=plan.state.value,
                status="skipped",
                provider_called=False,
            )

        if plan.planned_action == TranslationUpdateAction.SKIP_MANUAL_UNTRACKED.value:
            return BulkItemResult(
                content_id=plan.content_id,
                label=plan.label,
                initial_state=plan.state.value,
                action=TranslationUpdateAction.SKIP_MANUAL_UNTRACKED.value,
                final_state=plan.state.value,
                status="skipped",
                provider_called=False,
            )

        if plan.state == TranslationUpdateState.TEXT_OUTDATED and not include_text_outdated:
            return BulkItemResult(
                content_id=plan.content_id,
                label=plan.label,
                initial_state=plan.state.value,
                action="skip_text_outdated",
                final_state=plan.state.value,
                status="skipped",
                provider_called=False,
            )

        confirm_overwrite = (
            plan.state == TranslationUpdateState.TEXT_OUTDATED and include_text_outdated
        )
        provider_expected = plan.planned_action == TranslationUpdateAction.GENERATE_FULL.value

        try:
            _, classification = self._updater.update(
                module=module,
                content_id=plan.content_id,
                target_locale=locale,
                confirm_overwrite=confirm_overwrite,
            )
            reported_action = plan.planned_action
            is_skip = reported_action in (
                TranslationUpdateAction.SKIP_CURRENT.value,
                TranslationUpdateAction.SKIP_MANUAL_UNTRACKED.value,
            )
            return BulkItemResult(
                content_id=plan.content_id,
                label=plan.label,
                initial_state=plan.state.value,
                action=reported_action,
                final_state=classification.state.value,
                status="skipped" if is_skip else "completed",
                provider_called=provider_expected
                and reported_action == TranslationUpdateAction.GENERATE_FULL.value,
            )
        except OverwriteConfirmationRequired as exc:
            return BulkItemResult(
                content_id=plan.content_id,
                label=plan.label,
                initial_state=plan.state.value,
                action=plan.planned_action,
                final_state=plan.state.value,
                status="failed",
                provider_called=False,
                error=exc.message,
            )
        except (TranslationUpdateError, TranslationError, KeyError, ValueError) as exc:
            message = getattr(exc, "message", None) or str(exc)
            return BulkItemResult(
                content_id=plan.content_id,
                label=plan.label,
                initial_state=plan.state.value,
                action=plan.planned_action,
                final_state=None,
                status="failed",
                provider_called=False,
                error=message,
            )
        except Exception as exc:  # noqa: BLE001 — isolate bulk item failures
            return BulkItemResult(
                content_id=plan.content_id,
                label=plan.label,
                initial_state=plan.state.value,
                action=plan.planned_action,
                final_state=None,
                status="failed",
                provider_called=False,
                error=str(exc),
            )

    @staticmethod
    def _result_dict(result: BulkItemResult) -> dict[str, Any]:
        return {
            "contentId": result.content_id,
            "label": result.label,
            "initialState": result.initial_state,
            "action": result.action,
            "finalState": result.final_state,
            "status": result.status,
            "providerCalled": result.provider_called,
            "error": result.error,
        }
