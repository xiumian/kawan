# chenfenpro Storefront Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the public storefront from a narrative landing page into a direct commerce entry: thin header, full sellable product list on the home page, and product detail pages that remain the real checkout entry point.

**Architecture:** Keep the existing order, payment, checkout, and lookup flow intact. Limit code changes to the storefront shell, navigation, homepage composition, and product-detail density, while preserving the shared transactional components that already work.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest, React Testing Library

---

## Planned File Structure

- `src/app/(public)/page.tsx`
- `src/app/(public)/layout.tsx`
- `src/app/(public)/products/[slug]/page.tsx`
- `src/components/site-header.tsx`
- `src/components/site-footer.tsx`
- `src/components/product-strip.tsx`
- `src/modules/site/brand-config.ts`
- `src/modules/site/site-content.ts`
- `src/modules/catalog/catalog.repository.ts`
- `src/modules/catalog/catalog.service.ts`
- `src/app/globals.css`
- `tests/unit/site/brand-config.test.ts`
- `tests/unit/catalog/catalog.service.test.ts`
- `tests/unit/components/site-header.test.tsx`
- `tests/unit/components/product-strip.test.tsx`

### Task 1: Simplify the global storefront shell

**Files:**
- Modify: `src/modules/site/brand-config.ts`
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/site-footer.tsx`
- Modify: `src/app/(public)/layout.tsx`
- Modify: `tests/unit/site/brand-config.test.ts`
- Create: `tests/unit/components/site-header.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";

import { brandConfig } from "@/modules/site/brand-config";

describe("brandConfig", () => {
  it("keeps a minimal storefront nav", () => {
    expect(brandConfig.nav).toEqual([
      { href: "/orders/lookup", label: "查单" },
      { href: "/admin", label: "后台" },
    ]);
  });
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "@/components/site-header";

describe("SiteHeader", () => {
  it("renders only the brand link plus query and admin entry points", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: /chenfenpro/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: "查单" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "后台" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "帮助" })).toBeNull();
    expect(screen.queryByRole("link", { name: "首页" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/site/brand-config.test.ts tests/unit/components/site-header.test.tsx`
Expected: FAIL because `brandConfig.nav` still contains `首页` and `帮助`, and `SiteHeader` still renders the old navigation set.

- [ ] **Step 3: Write minimal implementation**

```ts
export const brandConfig = {
  name: "chenfenpro",
  tagline: "直接选商品，支付后自动发货",
  nav: [
    { href: "/orders/lookup", label: "查单" },
    { href: "/admin", label: "后台" },
  ],
} as const;
```

```tsx
<header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(6,12,16,0.84)] backdrop-blur">
  <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
    <Link href="/" className="text-lg font-semibold text-white">
      {brandConfig.name}
    </Link>
    <nav className="flex items-center gap-5 text-sm text-slate-300">
      {brandConfig.nav.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  </div>
</header>
```

```tsx
<footer className="border-t border-white/10">
  <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-slate-500">
    © 2026 {brandConfig.name}
  </div>
</footer>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/site/brand-config.test.ts tests/unit/components/site-header.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/site/brand-config.ts src/components/site-header.tsx src/components/site-footer.tsx src/app/(public)/layout.tsx tests/unit/site/brand-config.test.ts tests/unit/components/site-header.test.tsx
git commit -m "feat: simplify chenfenpro storefront shell"
```

### Task 2: Replace the homepage hero with a direct product list

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/components/product-strip.tsx`
- Modify: `src/modules/catalog/catalog.repository.ts`
- Modify: `src/modules/catalog/catalog.service.ts`
- Modify: `tests/unit/catalog/catalog.service.test.ts`
- Create: `tests/unit/components/product-strip.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";

import { buildStorefrontProducts } from "@/modules/catalog/catalog.service";

describe("buildStorefrontProducts", () => {
  it("preserves the incoming sellable order and does not feature-sort it", () => {
    const result = buildStorefrontProducts([
      { slug: "first", isFeatured: false },
      { slug: "second", isFeatured: true },
    ]);

    expect(result.map((item) => item.slug)).toEqual(["first", "second"]);
  });
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductStrip } from "@/components/product-strip";

describe("ProductStrip", () => {
  it("renders a compact commerce card with detail CTA", () => {
    render(
      <ProductStrip
        product={{
          id: "p1",
          slug: "steam-wallet-100",
          name: "Steam Wallet 100",
          summary: "热门游戏礼品卡，支付后秒发卡密。",
          priceLabel: "¥100.00",
          stockLabel: "库存 8",
        }}
      />,
    );

    expect(screen.getByText("Steam Wallet 100")).toBeTruthy();
    expect(screen.getByText("¥100.00")).toBeTruthy();
    expect(screen.getByText("库存 8")).toBeTruthy();
    expect(screen.getByRole("link", { name: "查看详情" })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/catalog/catalog.service.test.ts tests/unit/components/product-strip.test.tsx`
Expected: FAIL because `buildStorefrontProducts` does not exist and `ProductStrip` still renders the old `立即下单` strip layout.

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildStorefrontProducts<T>(products: T[]) {
  return [...products];
}
```

```ts
export async function getSellableProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      stockItems: {
        some: {
          status: StockStatus.AVAILABLE,
        },
      },
    },
    include: {
      category: true,
      _count: {
        select: {
          stockItems: {
            where: {
              status: StockStatus.AVAILABLE,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return products.map(mapFeaturedProduct);
}
```

```tsx
<article className="panel-surface grid gap-4 md:grid-cols-[144px_1fr_auto] md:items-center">
  <div className="aspect-square rounded-2xl border border-white/10 bg-white/5" />
  <div className="space-y-2">
    <h3 className="text-xl font-semibold text-white">{product.name}</h3>
    <p className="text-sm text-slate-400">{product.summary}</p>
    <div className="flex gap-4 text-sm text-slate-300">
      <span>{product.priceLabel}</span>
      <span>{product.stockLabel}</span>
    </div>
  </div>
  <Link className="action-secondary" href={`/products/${product.slug}`}>
    查看详情
  </Link>
</article>
```

```tsx
<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-16 pt-6">
  <section className="space-y-2 border-b border-white/10 pb-5">
    <h1 className="text-3xl font-semibold text-white">商品列表</h1>
    <p className="text-sm text-slate-400">
      选择商品后进入详情页下单，支付成功自动发货。
    </p>
  </section>
  <section className="space-y-4">
    {products.map((product) => (
      <ProductStrip key={product.id} product={product} />
    ))}
  </section>
</div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/catalog/catalog.service.test.ts tests/unit/components/product-strip.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/page.tsx src/components/product-strip.tsx src/modules/catalog/catalog.repository.ts src/modules/catalog/catalog.service.ts tests/unit/catalog/catalog.service.test.ts tests/unit/components/product-strip.test.tsx
git commit -m "feat: convert homepage into direct product list"
```

### Task 3: Tighten the product detail page into a pure order entry page

**Files:**
- Modify: `src/app/(public)/products/[slug]/page.tsx`
- Modify: `src/components/purchase-form.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/unit/components/purchase-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PurchaseForm } from "@/components/purchase-form";

describe("PurchaseForm", () => {
  it("renders the streamlined purchase CTA copy", () => {
    render(
      <PurchaseForm
        productId="p1"
        productName="Steam Wallet 100"
        priceLabel="¥100.00"
        minQuantity={1}
        maxQuantity={3}
      />,
    );

    expect(screen.getByRole("button", { name: "立即购买" })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "生成专属二维码" }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/components/purchase-form.test.tsx`
Expected: FAIL because the form still uses the old CTA copy.

- [ ] **Step 3: Write minimal implementation**

```tsx
<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-16 pt-8">
  <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
    <div className="space-y-5">
      <h1 className="text-4xl font-semibold text-white">{product.name}</h1>
      <p className="text-base text-slate-300">{product.summary}</p>
      <div className="flex flex-wrap gap-4 text-sm text-slate-300">
        <span>{product.priceLabel}</span>
        <span>库存 {product.availableStock}</span>
        <span>限购 {product.purchaseLimitMin}-{product.purchaseLimitMax}</span>
      </div>
      <div className="panel-surface space-y-3">
        <h2 className="text-lg font-semibold text-white">商品说明</h2>
        <p className="text-sm leading-7 text-slate-300">{product.description}</p>
      </div>
    </div>
    <PurchaseForm
      productId={product.id}
      productName={product.name}
      priceLabel={product.priceLabel}
      minQuantity={product.purchaseLimitMin ?? 1}
      maxQuantity={product.purchaseLimitMax ?? 5}
      disabled={product.availableStock <= 0}
    />
  </section>
</div>
```

```tsx
<button className="action-primary w-full justify-center">
  {disabled ? "库存不足" : submitting ? "创建订单中..." : "立即购买"}
</button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/components/purchase-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/products/[slug]/page.tsx src/components/purchase-form.tsx src/app/globals.css tests/unit/components/purchase-form.test.tsx
git commit -m "feat: streamline product detail ordering page"
```

### Task 4: Remove obsolete homepage copy and verify storefront flows

**Files:**
- Delete: `src/modules/site/site-content.ts`
- Modify: `src/app/layout.tsx`
- Modify: `README.md`
- Test: `tests/e2e/storefront-smoke.md`

- [ ] **Step 1: Write the failing verification artifact**

```md
# Storefront Smoke Checklist

- [ ] Home page opens directly to product list
- [ ] Header shows only chenfenpro / 查单 / 后台
- [ ] Product list item links to detail page
- [ ] Detail page still creates an order
- [ ] Checkout page still displays payment QR
- [ ] Order lookup still returns delivered keys after payment
```

- [ ] **Step 2: Run verification to show old homepage still fails the checklist**

Run: `npm run dev`
Expected: Manual check shows the existing hero-led homepage still violates the new first screen requirements.

- [ ] **Step 3: Write minimal implementation**

```ts
export const metadata = {
  title: {
    default: "chenfenpro",
    template: "%s | chenfenpro",
  },
  description: "进入首页直接选商品，详情页完成下单，支付成功后自动发货。",
};
```

```md
- Home page is now a direct product list, not a narrative landing page.
```

```bash
git rm src/modules/site/site-content.ts
```

- [ ] **Step 4: Run verification to confirm the new flow**

Run: `npm run test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

Run: `npm run dev`
Expected: Home page opens to thin header + compact product list, and the order flow remains intact.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx README.md tests/e2e/storefront-smoke.md
git commit -m "chore: finalize simplified storefront copy and verification"
```

## Self-Review

- Spec coverage: homepage simplification, thin header, full sellable list, smaller footer, and detail-page ordering flow are all mapped to tasks.
- Placeholder scan: no unresolved placeholders, generic “fix later”, or missing file paths remain.
- Type consistency: shared names use `brandConfig`, `buildStorefrontProducts`, `ProductStrip`, and `PurchaseForm` consistently across tasks.
