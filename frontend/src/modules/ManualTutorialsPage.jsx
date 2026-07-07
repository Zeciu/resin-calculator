import { useCallback, useEffect, useRef, useState } from "react";
import ManualContent from "../manual/ManualContent.jsx";
import { fetchPublishedManual } from "../manual/manualApi.js";
import ManualTableOfContents from "../manual/ManualTableOfContents.jsx";

const DEFAULT_LOCALE = "en";

export default function ManualTutorialsPage() {
  const readingPaneRef = useRef(null);
  const [sections, setSections] = useState([]);
  const [loadState, setLoadState] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadManual() {
      setLoadState("loading");
      try {
        const payload = await fetchPublishedManual(DEFAULT_LOCALE);
        if (cancelled) {
          return;
        }
        if (!payload.available) {
          setSections([]);
          setLoadState("error");
          return;
        }
        setSections(payload.sections);
        setLoadState("ready");
      } catch {
        if (!cancelled) {
          setSections([]);
          setLoadState("error");
        }
      }
    }

    loadManual();
    return () => {
      cancelled = true;
    };
  }, []);

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
            <h1 className="manual-module__title">Manual &amp; Tutorials</h1>
            <p className="manual-module__lede">
              A continuous guide to the HFZWood resin estimation workflow, with embedded
              demonstrations where visual explanation helps.
            </p>
          </header>
          {loadState === "loading" ? (
            <p className="manual-module__status" role="status">
              Loading manual...
            </p>
          ) : null}
          {loadState === "error" ? (
            <p className="manual-module__status manual-module__status--error" role="alert">
              Manual content is unavailable right now.
            </p>
          ) : null}
          {loadState === "ready" ? <ManualContent sections={sections} /> : null}
        </article>
      </div>
    </section>
  );
}
