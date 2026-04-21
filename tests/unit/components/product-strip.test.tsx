import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProductStrip } from "@/components/product-strip";

afterEach(() => {
  cleanup();
});

describe("ProductStrip", () => {
  it("renders a compact storefront card with a details link", () => {
    const summary = "即开即用";

    render(
      <ProductStrip
        product={{
          id: "product-1",
          slug: "steam-100",
          name: "Steam 100",
          summary,
          priceLabel: "¥19.90",
          stockLabel: "库存 12",
          category: { name: "游戏平台" },
        }}
      />,
    );

    expect(screen.getByText("Steam 100")).toBeTruthy();
    expect(screen.getByText(summary)).toBeTruthy();
    expect(screen.getByText("¥19.90")).toBeTruthy();
    expect(screen.getByText("库存 12")).toBeTruthy();
    expect(screen.getAllByText("游戏平台")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "查看详情" }).getAttribute("href"),
    ).toBe("/products/steam-100");
  });

  it("omits the summary block when summary is missing", () => {
    const summary = "即开即用";

    render(
      <ProductStrip
        product={{
          id: "product-2",
          slug: "spotify",
          name: "Spotify",
          priceLabel: "¥9.90",
          stockLabel: "库存 8",
        }}
      />,
    );

    expect(screen.queryByText("Spotify")).toBeTruthy();
    expect(screen.queryByText(summary)).toBeNull();
  });
});
