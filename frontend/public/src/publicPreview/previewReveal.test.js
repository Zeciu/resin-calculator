import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PREVIEW_REVEAL_TOP_OFFSET_PX,
  getPreviewScrollOwner,
  revealPreviewUnlockedContent,
  scrollOwnerToTarget,
} from "./previewSearch.js";

function layoutRect(top, height = 80) {
  return {
    top,
    bottom: top + height,
    left: 0,
    right: 400,
    width: 400,
    height,
    x: 0,
    y: top,
    toJSON() {},
  };
}

function mockBox(node, { top, height = 80, clientHeight, scrollHeight, overflowY }) {
  node.getBoundingClientRect = () => layoutRect(top, height);
  if (clientHeight != null) {
    Object.defineProperty(node, "clientHeight", { configurable: true, value: clientHeight });
  }
  if (scrollHeight != null) {
    Object.defineProperty(node, "scrollHeight", { configurable: true, value: scrollHeight });
  }
  if (overflowY) {
    node.style.overflowY = overflowY;
  }
}

describe("preview unlocked content reveal against measured scroll owners", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("uses the Glossary list scroller on desktop when that node actually overflows", () => {
    document.body.innerHTML = `
      <div class="application-workspace" style="overflow: hidden; height: 700px;">
        <div class="glossary-module__scroll" style="overflow-y: auto;">
          <div data-preview-unlocked-content>
            <article id="glossary-entry-open-a">
              <div class="glossary-entry__body">Definition</div>
            </article>
          </div>
        </div>
      </div>
    `;
    const workspace = document.querySelector(".application-workspace");
    const list = document.querySelector(".glossary-module__scroll");
    const target = document.querySelector("[data-preview-unlocked-content]");
    mockBox(workspace, { top: 0, height: 700, clientHeight: 700, scrollHeight: 700, overflowY: "hidden" });
    mockBox(list, { top: 120, height: 500, clientHeight: 500, scrollHeight: 2400, overflowY: "auto" });
    mockBox(target, { top: 960, height: 220 });

    expect(getPreviewScrollOwner(target)).toBe(list);
  });

  it("falls back to the document when the Glossary list exists but does not overflow", () => {
    document.body.innerHTML = `
      <div class="glossary-module__scroll" style="overflow-y: auto;">
        <div data-preview-unlocked-content>
          <article id="glossary-entry-open-a">
            <div class="glossary-entry__body">Definition</div>
          </article>
        </div>
      </div>
    `;
    const list = document.querySelector(".glossary-module__scroll");
    const target = document.querySelector("[data-preview-unlocked-content]");
    mockBox(list, { top: 0, height: 2400, clientHeight: 2400, scrollHeight: 2400, overflowY: "auto" });
    mockBox(target, { top: 900, height: 220 });
    Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 700 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2600 });

    expect(getPreviewScrollOwner(target)).toBe(document.documentElement);
  });

  it("scrolls the Glossary inner list scroller so the unlocked definition region is brought to the top offset", () => {
    document.body.innerHTML = `
      <main class="dedicated-module-layout__content" style="overflow: hidden;">
        <section class="glossary-module knowledge-preview-module">
          <div class="glossary-module__scroll">
            <div class="locked-row"></div>
            <div data-preview-unlocked-content>
              <article id="glossary-entry-open-a">
                <button class="glossary-entry__toggle" type="button">Term</button>
                <div class="glossary-entry__body">Readable definition</div>
              </article>
            </div>
          </div>
        </section>
      </main>
    `;
    const shell = document.querySelector(".dedicated-module-layout__content");
    const clipModule = document.querySelector(".knowledge-preview-module");
    const list = document.querySelector(".glossary-module__scroll");
    const target = document.querySelector("[data-preview-unlocked-content]");
    const body = document.querySelector(".glossary-entry__body");
    const toggle = document.querySelector(".glossary-entry__toggle");

    mockBox(shell, { top: 80, height: 700, clientHeight: 700, scrollHeight: 700, overflowY: "hidden" });
    mockBox(clipModule, { top: 80, height: 700, clientHeight: 700, scrollHeight: 700, overflowY: "auto" });
    mockBox(list, { top: 160, height: 520, clientHeight: 520, scrollHeight: 2600, overflowY: "auto" });
    list.scrollTop = 0;
    const scrollTo = vi.fn(function scrollList({ top }) {
      this.scrollTop = top;
    });
    list.scrollTo = scrollTo;
    mockBox(target, { top: 1100, height: 240 });
    body.getBoundingClientRect = () => layoutRect(1180, 160);
    toggle.scrollIntoView = vi.fn();
    target.scrollIntoView = vi.fn();

    expect(getPreviewScrollOwner(target)).toBe(list);
    expect(scrollOwnerToTarget(list, target)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({
      top: 1100 - 160 - PREVIEW_REVEAL_TOP_OFFSET_PX,
      behavior: "auto",
    });
    expect(toggle.scrollIntoView).not.toHaveBeenCalled();
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls the document for Knowledge Base and ignores overflow-x clip on the module", () => {
    document.body.innerHTML = `
      <div class="knowledge-base-module knowledge-preview-module" style="overflow-x: clip;">
        <div class="knowledge-base-module__scroll" style="overflow: visible;">
          <div data-preview-unlocked-content>
            <article id="knowledge-base-entry-open-a">
              <button class="knowledge-base-entry__toggle" type="button">Title</button>
              <div class="knowledge-base-entry__body">Readable article</div>
            </article>
          </div>
        </div>
      </div>
    `;
    const clipModule = document.querySelector(".knowledge-preview-module");
    const list = document.querySelector(".knowledge-base-module__scroll");
    const target = document.querySelector("[data-preview-unlocked-content]");
    mockBox(clipModule, { top: 0, height: 2400, clientHeight: 2400, scrollHeight: 2400, overflowY: "auto" });
    mockBox(list, { top: 80, height: 2200, clientHeight: 2200, scrollHeight: 2200, overflowY: "visible" });
    mockBox(target, { top: 1600, height: 280 });
    Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 700 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2600 });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    window.scrollY = 0;

    expect(getPreviewScrollOwner(target)).toBe(document.documentElement);
    expect(scrollOwnerToTarget(document.documentElement, target)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({
      top: 1600 - PREVIEW_REVEAL_TOP_OFFSET_PX,
      behavior: "auto",
    });
  });

  it("returns false and does not scroll when the readable body has not rendered", () => {
    document.body.innerHTML = `
      <div class="glossary-module__scroll" style="overflow-y: auto;">
        <div data-preview-unlocked-content>
          <article id="glossary-entry-open-a">
            <button class="glossary-entry__toggle" type="button">Term</button>
          </article>
        </div>
      </div>
    `;
    const list = document.querySelector(".glossary-module__scroll");
    mockBox(list, { top: 0, height: 400, clientHeight: 400, scrollHeight: 1600, overflowY: "auto" });
    list.scrollTo = vi.fn();
    const article = document.getElementById("glossary-entry-open-a");
    expect(revealPreviewUnlockedContent(article)).toBe(false);
    expect(list.scrollTo).not.toHaveBeenCalled();
  });

  it("marks reveal complete only after the unlocked region is in the owner's visible area", () => {
    document.body.innerHTML = `
      <div class="glossary-module__scroll" style="overflow-y: auto;">
        <div data-preview-unlocked-content>
          <article id="glossary-entry-open-a">
            <div class="glossary-entry__body">Readable definition</div>
          </article>
        </div>
      </div>
    `;
    const list = document.querySelector(".glossary-module__scroll");
    const target = document.querySelector("[data-preview-unlocked-content]");
    const body = document.querySelector(".glossary-entry__body");
    mockBox(list, { top: 0, height: 500, clientHeight: 500, scrollHeight: 2000, overflowY: "auto" });
    list.scrollTop = 0;
    let targetTop = 1200;
    target.getBoundingClientRect = () => layoutRect(targetTop, 200);
    body.getBoundingClientRect = () => layoutRect(targetTop + 48, 120);
    list.scrollTo = vi.fn(function scrollList({ top }) {
      this.scrollTop = top;
      targetTop = PREVIEW_REVEAL_TOP_OFFSET_PX;
    });

    expect(revealPreviewUnlockedContent(document.getElementById("glossary-entry-open-a"))).toBe(true);
    expect(list.scrollTo).toHaveBeenCalledTimes(1);
    expect(list.scrollTop).toBe(1200 - PREVIEW_REVEAL_TOP_OFFSET_PX);
  });
});
