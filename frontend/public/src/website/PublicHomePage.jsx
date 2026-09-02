import {
  canRenderHomeCta,
  resolveHomeVideoSource,
} from "./homePublicUtils.js";
import { BookOpen, FolderOpen, ShieldCheck } from "lucide-react";
import WebsiteDestinationLink from "./WebsiteDestinationLink.jsx";

const FEATURE_ICONS = [FolderOpen, BookOpen, ShieldCheck];

function splitHomeDescriptionBlocks(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map(([title, ...bodyLines]) => ({
      title: bodyLines.length > 0 ? title : null,
      body: bodyLines.length > 0 ? bodyLines.join(" ") : title,
    }));
}

function HomeDescriptionBlocks({ blocks }) {
  return blocks.map((block, index) => (
    <div key={`${index}-${block.body.slice(0, 24)}`} className="public-home__description-block">
      {block.title ? <h2>{block.title}</h2> : null}
      <p>{block.body}</p>
    </div>
  ));
}

/**
 * CMS-driven Home marketing body (guest and authenticated share this content).
 * Hero title, subtitle, and hero image render in WorkspaceHero.
 * `besideVideoExtras` is Home product-explanation copy in the left column beside the video.
 *
 * @param {{ body: Record<string, unknown>, besideVideoExtras?: import("react").ReactNode }} props
 */
export default function PublicHomePage({ body, besideVideoExtras = null }) {
  const cta = body.cta;
  const video = resolveHomeVideoSource(body.video);
  const showCta = canRenderHomeCta(cta);
  const descriptionBlocks = splitHomeDescriptionBlocks(body.description);
  const upperDescriptionBlocks = video ? descriptionBlocks.slice(0, 1) : descriptionBlocks;
  const followupDescriptionBlocks = video ? descriptionBlocks.slice(1, 2) : [];
  const featureDescriptionBlocks = video ? descriptionBlocks.slice(2) : [];

  return (
    <section className="public-home" aria-label="Home">
      <div className="public-home__upper">
        <div className="public-home__description">
          <HomeDescriptionBlocks blocks={upperDescriptionBlocks.slice(0, 1)} />
          {besideVideoExtras}
          <HomeDescriptionBlocks blocks={upperDescriptionBlocks.slice(1)} />
        </div>

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
      </div>

      {followupDescriptionBlocks.length > 0 ? (
        <div className="public-home__description public-home__description--followup">
          {followupDescriptionBlocks.map((block, index) => (
            <div key={`${index}-${block.body.slice(0, 24)}`} className="public-home__description-block">
              {block.title ? <h2>{block.title}</h2> : null}
              <p>{block.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {featureDescriptionBlocks.length > 0 ? (
        <div className="public-home__features">
          {featureDescriptionBlocks.map((block, index) => {
            const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
            return (
              <div key={`${index}-${block.body.slice(0, 24)}`} className="public-home__feature">
                <Icon className="public-home__feature-icon" aria-hidden="true" />
                <div className="public-home__description-block">
                  {block.title ? <h2>{block.title}</h2> : null}
                  <p>{block.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {showCta ? (
        <WebsiteDestinationLink
          className="public-home__cta"
          label={String(cta.label).trim()}
          destination={String(cta.destination).trim()}
        />
      ) : null}
    </section>
  );
}
