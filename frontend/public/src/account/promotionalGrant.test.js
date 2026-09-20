import { describe, expect, it } from "vitest";
import { formatGrantExpiryDate, hasActivePromotionalGrant } from "./promotionalGrant.js";

const GRANT_20_DEC_2026 = Math.floor(Date.UTC(2026, 11, 20) / 1000);

describe("promotionalGrant helpers", () => {
  it("treats a future grantExpiresAt as active and ignores missing or past values", () => {
    expect(hasActivePromotionalGrant({ grantExpiresAt: GRANT_20_DEC_2026 }, GRANT_20_DEC_2026 - 1)).toBe(
      true,
    );
    expect(hasActivePromotionalGrant({ grantExpiresAt: GRANT_20_DEC_2026 }, GRANT_20_DEC_2026)).toBe(
      false,
    );
    expect(hasActivePromotionalGrant({ grantExpiresAt: GRANT_20_DEC_2026 }, GRANT_20_DEC_2026 + 1)).toBe(
      false,
    );
    expect(hasActivePromotionalGrant({ grantExpiresAt: null }, GRANT_20_DEC_2026)).toBe(false);
    expect(hasActivePromotionalGrant({}, GRANT_20_DEC_2026)).toBe(false);
    expect(hasActivePromotionalGrant(null, GRANT_20_DEC_2026)).toBe(false);
  });

  it("formats grant expiry as day + localized month + year in UTC", () => {
    expect(formatGrantExpiryDate(GRANT_20_DEC_2026, "en")).toBe("20 December 2026");
    expect(formatGrantExpiryDate(GRANT_20_DEC_2026, "ro")).toBe("20 decembrie 2026");
    expect(formatGrantExpiryDate(GRANT_20_DEC_2026, "fr")).toBe("20 décembre 2026");
    expect(formatGrantExpiryDate(GRANT_20_DEC_2026, "de")).toBe("20. Dezember 2026");
  });
});
