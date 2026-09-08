import PublicWebsitePageShell from "./PublicWebsitePageShell.jsx";
import WebsiteSectionBlocks from "./WebsiteSectionBlocks.jsx";
import { WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

const ABOUT_HERO_SECTION_ID = "hero";
const EXPERIENCE_BLOCK_COUNT = 2;

function isRenderableWebsiteBlock(block) {
  const type = String(block?.type ?? "");
  if (type !== "heading" && type !== "paragraph") {
    return false;
  }
  return String(block?.text ?? "").trim().length > 0;
}

function splitAboutPageSections(sections) {
  const list = Array.isArray(sections) ? sections : [];
  const hero = list.find((section) => section?.id === ABOUT_HERO_SECTION_ID) ?? null;
  const contentSections = list.filter((section) => section?.id !== ABOUT_HERO_SECTION_ID);
  return { hero, contentSections };
}

function pairContentSections(sections) {
  const pairs = [];
  for (let index = 0; index < sections.length; index += 2) {
    pairs.push(sections.slice(index, index + 2));
  }
  return pairs;
}

export default function PublicAboutPage() {
  return (
    <PublicWebsitePageShell pageKey={WEBSITE_PAGE_KEYS.ABOUT} ariaLabelKey="website.nav.about">
      {(body) => {
        const { hero, contentSections } = splitAboutPageSections(body.sections ?? []);
        const heroBlocks = (hero?.blocks ?? []).filter(isRenderableWebsiteBlock);
        const experienceBlocks = heroBlocks.slice(0, EXPERIENCE_BLOCK_COUNT);
        const introBlocks = heroBlocks.slice(EXPERIENCE_BLOCK_COUNT);
        const heroTitle = String(hero?.title ?? "").trim();
        const heroImageSrc = String(hero?.image?.src ?? "").trim();
        const heroImageAlt = String(hero?.image?.alt ?? "").trim();
        const clusters = pairContentSections(contentSections);

        return (
          <div className="public-about">
            <div className="public-about__intro">
              {heroTitle ? <h2 className="public-about__proposition">{heroTitle}</h2> : null}
              {experienceBlocks.length > 0 ? (
                <div className="public-about__experience">
                  <WebsiteSectionBlocks
                    sections={[
                      {
                        id: "about-experience",
                        blocks: experienceBlocks,
                        image: heroImageSrc
                          ? { src: heroImageSrc, alt: heroImageAlt }
                          : undefined,
                      },
                    ]}
                    withSectionImages
                  />
                </div>
              ) : null}
              {introBlocks.length > 0 ? (
                <div className="public-about__intro-copy">
                  <WebsiteSectionBlocks
                    sections={[{ id: "about-intro-copy", blocks: introBlocks }]}
                  />
                </div>
              ) : null}
            </div>
            {clusters.length > 0 ? (
              <div className="public-about__clusters">
                {clusters.map((cluster, index) => (
                  <div
                    key={cluster
                      .map((section, sectionIndex) => section.id ?? `${index}-${sectionIndex}`)
                      .join("-")}
                    className={`public-about__cluster public-about__cluster--${
                      index % 2 === 0 ? "ivory" : "green"
                    }`}
                  >
                    <WebsiteSectionBlocks sections={cluster} withSectionImages />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      }}
    </PublicWebsitePageShell>
  );
}
