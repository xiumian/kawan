import { describe, expect, it } from "vitest";

import { brandConfig, formatPriceCny } from "@/modules/site/brand-config";

describe("brandConfig", () => {
  it("uses the simplified storefront identity", () => {
    expect(brandConfig).toEqual({
      name: "chenfenpro",
      nav: [
      { href: "/orders/lookup", label: "查单" },
      { href: "/admin", label: "后台" },
      ],
    });
  });

  it("formats price labels in CNY", () => {
    expect(formatPriceCny(12900)).toBe("¥129.00");
  });
});
