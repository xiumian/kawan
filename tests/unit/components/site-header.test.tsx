import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "@/components/site-header";

describe("SiteHeader", () => {
  it("renders only the storefront brand and primary nav", () => {
    render(<SiteHeader />);

    const links = screen.getAllByRole("link");
    const brandLink = screen.getByRole("link", { name: "chenfenpro" });
    const lookupLink = screen.getByRole("link", { name: "查单" });
    const adminLink = screen.getByRole("link", { name: "后台" });

    expect(links).toHaveLength(3);
    expect(brandLink.getAttribute("href")).toBe("/");
    expect(lookupLink.getAttribute("href")).toBe("/orders/lookup");
    expect(adminLink.getAttribute("href")).toBe("/admin");

    expect(screen.queryByRole("link", { name: "首页" })).toBeNull();
    expect(screen.queryByRole("link", { name: "帮助" })).toBeNull();
  });
});
