import { useCallback, useRef } from "react";
import ManualContent from "../manual/ManualContent.jsx";
import { fetchPublishedManual } from "../manual/manualApi.js";
import ManualTableOfContents from "../manual/ManualTableOfContents.jsx";
import ContentUnavailableMessage from "../content/ContentUnavailableMessage.jsx";
import { usePublishedContent } from "../content/usePublishedContent.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function ManualTutorialsPage() {
  const readingPaneRef = useRef(null);
  const { t } = useI18n();
  const { payload, loadState, viewEnglishVersion } = usePublishedContent(fetchPublishedManual);
  const sections = payload?.sections ?? [];

  const scrollToSection = useCallback((sectionId) => {
    const container = readingPaneRef.current;
    if (!container) {
      return;
    }

    const target = container.querySelector(`#${CSS.escape(sectionId)}`);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "auto", block: "start" });
  }, []);

  return (
    <section className="manual-module" aria-label="Manual and Tutorials">
      <aside className="manual-module__toc-panel">
        {loadState === "ready" ? (
          <ManualTableOfContents sections={sections} onNavigate={scrollToSection} />
        ) : null}
      </aside>
      <div className="manual-module__reading" ref={readingPaneRef}>
        <article className="manual-module__document">
          <header className="manual-module__document-header">
            <h1 className="manual-module__title">{t("content.manualTitle")}</h1>
          </header>
          {loadState === "loading" ? (
            <p className="manual-module__status" role="status">
              {t("content.loadingManual")}
            </p>
          ) : null}
          {loadState === "unavailable" || loadState === "error" ? (
            <ContentUnavailableMessage
              unavailableKey="content.unavailableManual"
              englishAvailable={Boolean(payload?.englishAvailable)}
              onViewEnglish={viewEnglishVersion}
            />
          ) : null}
          {loadState === "ready" ? <ManualContent sections={sections} /> : null}
        </article>
      </div>
    </section>
  );
}
