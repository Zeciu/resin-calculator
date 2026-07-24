/** Compact brand/mark icons for official community links (inline SVG). */

function SvgIcon({ children, title }) {
  return (
    <svg
      className="public-contact__community-icon-svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function WebsiteMarkIcon() {
  return (
    <SvgIcon title="Website">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </SvgIcon>
  );
}

export function YouTubeMarkIcon() {
  return (
    <SvgIcon title="YouTube">
      <path
        fill="currentColor"
        d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28.4 28.4 0 0 0 2 12a28.4 28.4 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22 12a28.4 28.4 0 0 0-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z"
      />
    </SvgIcon>
  );
}

export function FacebookMarkIcon() {
  return (
    <SvgIcon title="Facebook">
      <path
        fill="currentColor"
        d="M14.5 8.5V7.1c0-.7.1-1.1 1.1-1.1H17V3h-2.4C11.8 3 11 4.6 11 6.8v1.7H9V12h2v9h3.5v-9h2.4l.4-3.5h-2.8z"
      />
    </SvgIcon>
  );
}

export function InstagramMarkIcon() {
  return (
    <SvgIcon title="Instagram">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </SvgIcon>
  );
}

export function TikTokMarkIcon() {
  return (
    <SvgIcon title="TikTok">
      <path
        fill="currentColor"
        d="M16.6 4c.4 2.3 1.8 3.8 4 4.2v2.8c-1.4.1-2.7-.3-4-1.1v5.5c0 3.5-2.5 6.1-6.1 6.1A6.1 6.1 0 0 1 4.4 15c0-3.4 2.7-6.1 6.1-6.1.3 0 .7 0 1 .1v3a3.1 3.1 0 1 0 2.1 3V4h3z"
      />
    </SvgIcon>
  );
}

export function LinkedInMarkIcon() {
  return (
    <SvgIcon title="LinkedIn">
      <path
        fill="currentColor"
        d="M6.4 9.2H3.6V20h2.8V9.2zM5 4.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM13.6 9.2h-2.8V20h2.8v-5.4c0-1.4.3-2.8 2-2.8s1.8 1.2 1.8 2.8V20H20V13.8c0-3.2-1.7-4.6-4-4.6-1.9 0-2.7 1-3.2 1.8V9.2z"
      />
    </SvgIcon>
  );
}

/** @type {Record<string, () => JSX.Element>} */
export const OFFICIAL_LINK_ICONS = {
  website: WebsiteMarkIcon,
  youtube: YouTubeMarkIcon,
  facebook: FacebookMarkIcon,
  instagram: InstagramMarkIcon,
  tiktok: TikTokMarkIcon,
  linkedin: LinkedInMarkIcon,
};
