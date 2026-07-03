import { useCallback, useRef } from "react";
import ManualContent from "../manual/ManualContent.jsx";
import { MANUAL_SECTIONS } from "../manual/manualContent.js";
import ManualTableOfContents from "../manual/ManualTableOfContents.jsx";

export default function ManualTutorialsPage() {
  const readingPaneRef = useRef(null);

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
        <ManualTableOfContents sections={MANUAL_SECTIONS} onNavigate={scrollToSection} />
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
          <ManualContent sections={MANUAL_SECTIONS} />
        </article>
      </div>
    </section>
  );
}
