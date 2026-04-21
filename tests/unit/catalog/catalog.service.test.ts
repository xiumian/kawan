import { describe, expect, it } from "vitest";

import { buildStorefrontProducts } from "@/modules/catalog/catalog.service";

describe("buildStorefrontProducts", () => {
  it("preserves the incoming storefront order", () => {
    const result = buildStorefrontProducts([
      { slug: "office365" },
      { slug: "steam-100" },
      { slug: "spotify" },
    ]);

    expect(result.map((item) => item.slug)).toEqual([
      "office365",
      "steam-100",
      "spotify",
    ]);
  });
});
