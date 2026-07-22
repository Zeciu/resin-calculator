import AboutPageEditor from "./AboutPageEditor.jsx";
import ContactPageEditor from "./ContactPageEditor.jsx";
import DocumentSectionsPageEditor from "./DocumentSectionsPageEditor.jsx";
import HomePageEditor from "./HomePageEditor.jsx";
import PricingPageEditor from "./PricingPageEditor.jsx";

/**
 * @param {{
 *   pageKind: string;
 *   body: Record<string, unknown>;
 *   onChange: (body: Record<string, unknown>) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function WebsitePageEditor({ pageKind, body, onChange, disabled = false }) {
  switch (pageKind) {
    case "home":
      return <HomePageEditor body={body} onChange={onChange} disabled={disabled} />;
    case "about":
      return <AboutPageEditor body={body} onChange={onChange} disabled={disabled} />;
    case "pricing":
      return <PricingPageEditor body={body} onChange={onChange} disabled={disabled} />;
    case "privacy":
      return (
        <DocumentSectionsPageEditor
          body={body}
          onChange={onChange}
          disabled={disabled}
          pageLabel="privacy"
        />
      );
    case "terms":
      return (
        <DocumentSectionsPageEditor
          body={body}
          onChange={onChange}
          disabled={disabled}
          pageLabel="terms"
        />
      );
    case "contact":
      return <ContactPageEditor body={body} onChange={onChange} disabled={disabled} />;
    default:
      return null;
  }
}
