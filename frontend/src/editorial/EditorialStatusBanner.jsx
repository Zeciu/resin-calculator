import { resolveEditorialDisplay } from "./editorialStatus.js";

/**
 * @param {{
 *   isDirty: boolean;
 *   editorialVisibility?: string;
 *   exists?: boolean;
 *   locale: string;
 *   hasSelection?: boolean;
 * }} props
 */
export default function EditorialStatusBanner({
  isDirty,
  editorialVisibility,
  exists = true,
  locale,
  hasSelection = true,
}) {
  if (!hasSelection) {
    return null;
  }

  const display = resolveEditorialDisplay({ isDirty, editorialVisibility, exists, locale });

  return (
    <div className={`editorial-status editorial-status--${display.tone}`} role="status">
      <p className="editorial-status__label">{display.label}</p>
      <p className="editorial-status__message">{display.message}</p>
    </div>
  );
}
