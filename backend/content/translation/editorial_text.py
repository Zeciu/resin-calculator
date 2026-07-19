"""Extract and reconstruct translatable editorial draft fields."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from typing import Any, Literal

ContentFormat = Literal["plain", "html"]
EditorialModule = Literal["manual", "glossary", "knowledge_base"]


@dataclass(frozen=True, slots=True)
class TranslatableItem:
    path: tuple[Any, ...]
    text: str
    content_format: ContentFormat
    context: str | None = None


def _nonempty(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    if not value.strip():
        return None
    return value


def _get_path(root: Any, path: tuple[Any, ...]) -> Any:
    current = root
    for part in path:
        current = current[part]
    return current


def _set_path(root: Any, path: tuple[Any, ...], value: Any) -> None:
    current = root
    for part in path[:-1]:
        current = current[part]
    current[path[-1]] = value


def _append_item(
    items: list[TranslatableItem],
    *,
    path: tuple[Any, ...],
    text: Any,
    content_format: ContentFormat,
    context: str | None,
) -> None:
    value = _nonempty(text)
    if value is None:
        return
    items.append(
        TranslatableItem(
            path=path,
            text=value,
            content_format=content_format,
            context=context,
        )
    )


def _extract_manual_blocks(
    items: list[TranslatableItem],
    blocks: list[Any],
    path_prefix: tuple[Any, ...],
    context: str | None,
) -> None:
    for index, block in enumerate(blocks):
        if not isinstance(block, dict):
            continue
        block_type = block.get("type")
        block_path = path_prefix + (index,)
        if block_type in {"paragraph", "heading"}:
            _append_item(
                items,
                path=block_path + ("text",),
                text=block.get("text"),
                content_format="html",
                context=context,
            )
        elif block_type == "image":
            _append_item(
                items,
                path=block_path + ("alt",),
                text=block.get("alt"),
                content_format="plain",
                context=context,
            )
            _append_item(
                items,
                path=block_path + ("caption",),
                text=block.get("caption"),
                content_format="plain",
                context=context,
            )
        elif block_type == "video":
            _append_item(
                items,
                path=block_path + ("title",),
                text=block.get("title"),
                content_format="plain",
                context=context,
            )
            _append_item(
                items,
                path=block_path + ("caption",),
                text=block.get("caption"),
                content_format="plain",
                context=context,
            )
        elif block_type == "callout":
            inner_blocks = block.get("blocks") or []
            if isinstance(inner_blocks, list):
                _extract_manual_blocks(
                    items,
                    inner_blocks,
                    block_path + ("blocks",),
                    context,
                )


def extract_manual_items(draft_body: dict[str, Any]) -> list[TranslatableItem]:
    items: list[TranslatableItem] = []
    title = _nonempty(draft_body.get("title"))
    context = title
    _append_item(
        items,
        path=("title",),
        text=draft_body.get("title"),
        content_format="plain",
        context=None,
    )
    sections = draft_body.get("sections") or []
    if not isinstance(sections, list):
        return items
    for section_index, section in enumerate(sections):
        if not isinstance(section, dict):
            continue
        _append_item(
            items,
            path=("sections", section_index, "title"),
            text=section.get("title"),
            content_format="plain",
            context=context,
        )
        blocks = section.get("blocks") or []
        if isinstance(blocks, list):
            _extract_manual_blocks(
                items,
                blocks,
                ("sections", section_index, "blocks"),
                context,
            )
    return items


def extract_glossary_items(draft_body: dict[str, Any]) -> list[TranslatableItem]:
    items: list[TranslatableItem] = []
    term = _nonempty(draft_body.get("term"))
    context = term
    _append_item(
        items,
        path=("term",),
        text=draft_body.get("term"),
        content_format="plain",
        context=None,
    )
    definition_blocks = draft_body.get("definitionBlocks") or []
    if isinstance(definition_blocks, list):
        _extract_manual_blocks(
            items,
            definition_blocks,
            ("definitionBlocks",),
            context,
        )
    media = draft_body.get("media") or []
    if isinstance(media, list):
        _extract_manual_blocks(items, media, ("media",), context)
    see_also = draft_body.get("seeAlso") or []
    if isinstance(see_also, list):
        for index, ref in enumerate(see_also):
            if not isinstance(ref, dict):
                continue
            _append_item(
                items,
                path=("seeAlso", index, "label"),
                text=ref.get("label"),
                content_format="plain",
                context=context,
            )
    return items


def _extract_string_list(
    items: list[TranslatableItem],
    draft_body: dict[str, Any],
    field: str,
    context: str | None,
) -> None:
    values = draft_body.get(field) or []
    if not isinstance(values, list):
        return
    for index, value in enumerate(values):
        _append_item(
            items,
            path=(field, index),
            text=value,
            content_format="plain",
            context=context,
        )


def extract_knowledge_base_items(draft_body: dict[str, Any]) -> list[TranslatableItem]:
    items: list[TranslatableItem] = []
    title = _nonempty(draft_body.get("title"))
    context = title
    for field in ("title", "problemSummary", "estimatedRepairTime"):
        _append_item(
            items,
            path=(field,),
            text=draft_body.get(field),
            content_format="plain",
            context=None if field == "title" else context,
        )
    for field in (
        "symptoms",
        "possibleCauses",
        "solution",
        "prevention",
        "tips",
        "warnings",
        "searchKeywords",
        "requiredTools",
        "requiredMaterials",
    ):
        _extract_string_list(items, draft_body, field, context)
    media = draft_body.get("media") or []
    if isinstance(media, list):
        _extract_manual_blocks(items, media, ("media",), context)
    return items


def extract_translatable_items(
    module: EditorialModule,
    draft_body: dict[str, Any],
) -> list[TranslatableItem]:
    if module == "manual":
        return extract_manual_items(draft_body)
    if module == "glossary":
        return extract_glossary_items(draft_body)
    if module == "knowledge_base":
        return extract_knowledge_base_items(draft_body)
    raise ValueError(f"Unsupported editorial module: {module}")


def reconstruct_draft_body(
    source_draft: dict[str, Any],
    translations: list[tuple[TranslatableItem, str]],
) -> dict[str, Any]:
    """Return a deep copy of source_draft with translated strings applied."""
    result = deepcopy(source_draft)
    for item, translated in translations:
        _set_path(result, item.path, translated)
    return result
