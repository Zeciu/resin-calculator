import { Link } from "react-router-dom";
import { isInternalWebsitePath } from "./homePublicUtils.js";

/**
 * Shared SPA vs safe external destination link for public Website surfaces.
 *
 * @param {{
 *   label: string;
 *   destination: string;
 *   className?: string;
 * }} props
 */
export default function WebsiteDestinationLink({ label, destination, className }) {
  const trimmedLabel = String(label ?? "").trim();
  const trimmedDestination = String(destination ?? "").trim();

  if (isInternalWebsitePath(trimmedDestination)) {
    return (
      <Link className={className} to={trimmedDestination}>
        {trimmedLabel}
      </Link>
    );
  }

  return (
    <a
      className={className}
      href={trimmedDestination}
      target="_blank"
      rel="noopener noreferrer"
    >
      {trimmedLabel}
    </a>
  );
}
