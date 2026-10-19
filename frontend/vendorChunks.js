// Long-lived vendor chunks for the production build (used by vite.config.js).
// They change only when dependencies are upgraded, so browsers keep them cached
// across app deploys and download them in parallel with the app chunk.
// Lazy-only libraries (jsPDF, html2canvas, ...) are deliberately not listed so
// they stay out of the initial download.
const VENDOR_CHUNKS = {
  "vendor-react": [
    "react",
    "react-dom",
    "scheduler",
    "react-router",
    "react-router-dom",
    "cookie",
    "set-cookie-parser",
  ],
  "vendor-aws": [
    "aws-amplify",
    "@aws-amplify",
    "@aws-crypto",
    "@aws-sdk",
    "@smithy",
    "tslib",
    "js-cookie",
    "uuid",
  ],
};

export function vendorChunkFor(moduleId) {
  const match = moduleId.match(/node_modules[\\/]((@[^\\/]+)[\\/][^\\/]+|[^\\/]+)/);
  if (!match) {
    return undefined;
  }
  const packageName = match[1].replace(/\\/g, "/");
  const scope = match[2];
  for (const [chunkName, packages] of Object.entries(VENDOR_CHUNKS)) {
    if (packages.includes(packageName) || (scope && packages.includes(scope))) {
      return chunkName;
    }
  }
  return undefined;
}
