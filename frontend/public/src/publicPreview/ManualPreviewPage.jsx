import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { useLocation } from "react-router-dom";
import ManualContent from "../manual/ManualContent.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";
import PreviewBackLink from "./PreviewBackLink.jsx";
import PreviewEmptyState from "./PreviewEmptyState.jsx";
import PreviewLockedPanel from "./PreviewLockedPanel.jsx";
import PreviewSearch from "./PreviewSearch.jsx";
import { parseHashId } from "./previewLinks.js";
import { filterPreviewItems } from "./previewSearch.js";
import { usePublicPreview } from "./usePublicPreview.js";

export default function ManualPreviewPage() {
  const location = useLocation();
  const { t } = useI18n();
  const { payload, loadState } = usePublicPreview("manual");
  const chapters = payload?.chapters ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const filteredChapters = useMemo(
    () => filterPreviewItems(chapters, searchQuery, (chapter) => chapter.title),
    [chapters, searchQuery],
  );

  const fallbackId = useMemo(() => {
    return chapters.find((chapter) => chapter.locked === false)?.id ?? chapters[0]?.id ?? null;
  }, [chapters]);

  useEffect(() => {
    if (loadState !== "ready") {
      return;
    }
    const hashId = parseHashId(location.hash);
    if (hashId && chapters.some((chapter) => chapter.id === hashId)) {
      setSelectedId(hashId);
      return;
    }
    setSelectedId((current) => {
      if (current && chapters.some((chapter) => chapter.id === current)) {
        return current;
      }
      return fallbackId;
    });
  }, [chapters, fallbackId, loadState, location.hash]);

  const activeId =
    selectedId && chapters.some((chapter) => chapter.id === selectedId) ? selectedId : fallbackId;
  const selectedChapter = chapters.find((chapter) => chapter.id === activeId) ?? null;
  const showEmpty = loadState === "unavailable" || loadState === "error" || (loadState === "ready" && chapters.length === 0);

  return (
    <section className="manual-module knowledge-preview-module" aria-label={t("content.manualTitle")}>
      <PreviewBackLink />
      <aside className="manual-module__toc-panel">
        {loadState === "ready" && chapters.length > 0 ? (
          <nav className="manual-module__toc" aria-label={t("preview.contents")}>
            <h2 className="manual-module__toc-title">{t("preview.contents")}</h2>
            <div className="knowledge-preview-module__search">
              <PreviewSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholderKey="preview.searchPlaceholderTitle"
              />
            </div>
            {filteredChapters.length === 0 ? (
              <p className="knowledge-preview-module__no-matches">{t("preview.noSearchMatches")}</p>
            ) : (
              <ol className="manual-module__toc-list">
                {filteredChapters.map((chapter) => {
                  const selected = chapter.id === selectedId;
                  return (
                    <li key={chapter.id} className="manual-module__toc-item">
                      <button
                        type="button"
                        className={[
                          "manual-module__toc-link",
                          chapter.locked ? "knowledge-preview-toc__link--locked" : "knowledge-preview-toc__link--available",
                          selected ? "knowledge-preview-toc__link--selected" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        title={chapter.title}
                        aria-current={selected ? "true" : undefined}
                        onClick={() => setSelectedId(chapter.id)}
                      >
                        <span className="manual-module__toc-label">{chapter.title}</span>
                        {chapter.locked ? (
                          <span className="knowledge-preview-item__lock" aria-label={t("preview.lockedAria")}>
                            <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
                          </span>
                        ) : (
                          <span className="knowledge-preview-available__badge">{t("preview.availableInPreview")}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </nav>
        ) : null}
      </aside>
      <div className="manual-module__reading">
        <article className="manual-module__document">
          <header className="manual-module__document-header">
            <h1 className="manual-module__title">{t("content.manualTitle")}</h1>
            <p className="knowledge-preview-module__context">{t("preview.manualContext")}</p>
          </header>
          {loadState === "loading" ? (
            <p className="manual-module__status" role="status">
              {t("content.loadingManual")}
            </p>
          ) : null}
          {showEmpty ? <PreviewEmptyState /> : null}
          {loadState === "ready" && selectedChapter?.locked === false ? (
            <ManualContent
              sections={[
                {
                  id: selectedChapter.id,
                  title: selectedChapter.title,
                  blocks: selectedChapter.blocks ?? [],
                },
              ]}
            />
          ) : null}
          {loadState === "ready" && selectedChapter?.locked === true ? (
            <PreviewLockedPanel copyKey="preview.lockedManual" />
          ) : null}
        </article>
      </div>
    </section>
  );
}
