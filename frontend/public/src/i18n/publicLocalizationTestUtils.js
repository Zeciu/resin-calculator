import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";

export const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const PRODUCTION_PUBLIC_LANGUAGES_PATH = join(
  SRC_ROOT,
  "../../../backend/public/content/config/public-languages.json",
);

export function loadActivePublicLocales() {
  const config = JSON.parse(readFileSync(PRODUCTION_PUBLIC_LANGUAGES_PATH, "utf8"));
  expect(Array.isArray(config.activePublicLocales)).toBe(true);
  expect(config.activePublicLocales.length).toBeGreaterThan(0);
  return config.activePublicLocales;
}

export function extractLiteralI18nKeys(source) {
  return [...source.matchAll(/\bt\(\s*["']([^"']+)["']/g)].map((match) => match[1]);
}

export function collectLiteralKeysFromFiles(relativePaths) {
  const keys = new Set();
  for (const relativePath of relativePaths) {
    const source = readFileSync(join(SRC_ROOT, relativePath), "utf8");
    for (const key of extractLiteralI18nKeys(source)) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}
