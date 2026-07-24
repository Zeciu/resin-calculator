import { splitPlainTextParagraphs } from "./websitePlainText.js";

/**
 * Safe plain-text paragraph renderer for published Website CMS fields.
 *
 * @param {{
 *   text?: unknown;
 *   className?: string;
 * }} props
 */
export default function WebsitePlainText({ text, className = "website-plain-text__paragraph" }) {
  const paragraphs = splitPlainTextParagraphs(text);
  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div className="website-plain-text">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className={className}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
