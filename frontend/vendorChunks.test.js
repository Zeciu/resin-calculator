import { describe, expect, it } from "vitest";
import { vendorChunkFor } from "./vendorChunks.js";

// Guards the vendor chunk mapping so React/Router and AWS Amplify load as
// separate, long-cacheable files, while lazy-only libraries stay lazy.
describe("vendorChunkFor", () => {
  const nm = (pkg) => `E:\\repo\\frontend\\node_modules\\${pkg.replace("/", "\\")}\\dist\\index.js`;

  it("puts React and React Router in vendor-react", () => {
    for (const pkg of ["react", "react-dom", "scheduler", "react-router", "react-router-dom"]) {
      expect(vendorChunkFor(nm(pkg)), pkg).toBe("vendor-react");
    }
  });

  it("puts AWS Amplify and its scoped packages in vendor-aws", () => {
    for (const pkg of ["aws-amplify", "@aws-amplify/core", "@aws-amplify/auth", "@aws-crypto/sha256-js", "@smithy/util-utf8"]) {
      expect(vendorChunkFor(nm(pkg)), pkg).toBe("vendor-aws");
    }
    expect(vendorChunkFor("/repo/node_modules/@aws-amplify/core/dist/esm/index.mjs")).toBe("vendor-aws");
  });

  it("leaves lazy-only libraries and app code to Vite's default chunking", () => {
    for (const pkg of ["jspdf", "html2canvas", "dompurify", "lucide-react"]) {
      expect(vendorChunkFor(nm(pkg)), pkg).toBeUndefined();
    }
    expect(vendorChunkFor("E:\\repo\\frontend\\public\\src\\main.jsx")).toBeUndefined();
  });
});
