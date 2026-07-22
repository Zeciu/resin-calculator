"""Extract and reconstruct translatable editorial draft fields."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from typing import Any, Literal

ContentFormat = Literal["plain", "html"]
EditorialModule = Literal["manual", "glossary", "knowledge_base", "website"]


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


def _extract_about_sections(
    items: list[TranslatableItem],
    sections: list[Any],
    *,
    context: str | None,
) -> None:
    if not isinstance(sections, list):
        return
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
            _extract_manual_blocks(items, blocks, ("sections", section_index, "blocks"), context)
        image = section.get("image") or {}
        if isinstance(image, dict):
            _append_item(
                items,
                path=("sections", section_index, "image", "alt"),
                text=image.get("alt"),
                content_format="plain",
                context=context,
            )


def _extract_website_sections(
    items: list[TranslatableItem],
    sections: list[Any],
    *,
    context: str | None,
) -> None:
    if not isinstance(sections, list):
        return
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
            _extract_manual_blocks(items, blocks, ("sections", section_index, "blocks"), context)


def extract_website_items(draft_body: dict[str, Any]) -> list[TranslatableItem]:
    items: list[TranslatableItem] = []
    page_kind = draft_body.get("pageKind")
    context = _nonempty(draft_body.get("publicTitle"))
    _append_item(
        items,
        path=("publicTitle",),
        text=draft_body.get("publicTitle"),
        content_format="plain",
        context=None,
    )

    if page_kind == "home":
        for field in ("subtitle", "description"):
            _append_item(
                items,
                path=(field,),
                text=draft_body.get(field),
                content_format="plain",
                context=context,
            )
        image = draft_body.get("image") or {}
        if isinstance(image, dict):
            _append_item(
                items,
                path=("image", "alt"),
                text=image.get("alt"),
                content_format="plain",
                context=context,
            )
        cta = draft_body.get("cta") or {}
        if isinstance(cta, dict):
            _append_item(
                items,
                path=("cta", "label"),
                text=cta.get("label"),
                content_format="plain",
                context=context,
            )
        return items

    if page_kind == "about":
        _extract_about_sections(items, draft_body.get("sections") or [], context=context)
        return items

    if page_kind == "pricing":
        _append_item(
            items,
            path=("intro",),
            text=draft_body.get("intro"),
            content_format="plain",
            context=context,
        )
        offers = draft_body.get("offers") or []
        if isinstance(offers, list):
            for offer_index, offer in enumerate(offers):
                if not isinstance(offer, dict):
                    continue
                for field in ("title", "displayedPriceText", "ctaLabel"):
                    _append_item(
                        items,
                        path=("offers", offer_index, field),
                        text=offer.get(field),
                        content_format="plain",
                        context=context,
                    )
                benefits = offer.get("benefits") or []
                if isinstance(benefits, list):
                    for benefit_index, benefit in enumerate(benefits):
                        _append_item(
                            items,
                            path=("offers", offer_index, "benefits", benefit_index),
                            text=benefit,
                            content_format="plain",
                            context=context,
                        )
        _append_item(
            items,
            path=("footnote",),
            text=draft_body.get("footnote"),
            content_format="plain",
            context=context,
        )
        return items

    if page_kind in {"privacy", "terms"}:
        _extract_website_sections(items, draft_body.get("sections") or [], context=context)
        return items

    if page_kind == "contact":
        for field in ("intro", "manualLinkLabel", "knowledgeBaseLinkLabel"):
            _append_item(
                items,
                path=(field,),
                text=draft_body.get(field),
                content_format="plain",
                context=context,
            )
        links = draft_body.get("links") or []
        if isinstance(links, list):
            for link_index, link in enumerate(links):
                if not isinstance(link, dict):
                    continue
                _append_item(
                    items,
                    path=("links", link_index, "label"),
                    text=link.get("label"),
                    content_format="plain",
                    context=context,
                )
        return items

    raise ValueError(f"Unsupported website page kind: {page_kind}")


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
    if module == "website":
        return extract_website_items(draft_body)
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
