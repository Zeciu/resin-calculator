import {
  canRenderHomeCta,
  resolveHomeVideoSource,
} from "./homePublicUtils.js";
import WebsiteDestinationLink from "./WebsiteDestinationLink.jsx";
import WebsitePlainText from "./WebsitePlainText.jsx";

/**
 * CMS-driven Home marketing body (guest and authenticated share this content).
 * Hero title, subtitle, and hero image render in WorkspaceHero.
 *
 * @param {{ body: Record<string, unknown> }} props
 */
export default function PublicHomePage({ body }) {
  const cta = body.cta;
  const video = resolveHomeVideoSource(body.video);
  const showCta = canRenderHomeCta(cta);

  return (
    <section className="public-home" aria-label="Home">
      <WebsitePlainText text={body.description} className="public-home__description" />

      {showCta ? (
        <WebsiteDestinationLink
          className="public-home__cta"
          label={String(cta.label).trim()}
          destination={String(cta.destination).trim()}
        />
      ) : null}

      {video ? (
        <div className="public-home__video" aria-label="Home video">
          {video.kind === "video" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video className="public-home__video-element" src={video.src} controls playsInline />
          ) : (
            <iframe
              className="public-home__video-frame"
              src={video.src}
              title="Home video"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          )}
        </div>
      ) : null}
    </section>
  );
}
