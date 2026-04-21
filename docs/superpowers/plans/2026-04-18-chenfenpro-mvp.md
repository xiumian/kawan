# chenfenpro MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real, deployable `chenfenpro` MVP for self-operated key/CDK sales with guest checkout, QR payment flow, automatic key delivery, order lookup, and admin operations.

**Architecture:** Use a single Next.js app with clear module boundaries for catalog, orders, payments, delivery, and admin. Persist transactional data in MySQL through Prisma, use Redis for rate limiting and idempotency, and keep payment provider access behind an adapter interface so the first provider can be swapped later.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Prisma, MySQL, Redis, Zod, Vitest, React Testing Library, Playwright

---

## Planned File Structure

- `package.json`
- `next.config.ts`
- `src/app/(public)/page.tsx`
- `src/app/(public)/products/[slug]/page.tsx`
- `src/app/(public)/checkout/[orderNo]/page.tsx`
- `src/app/(public)/orders/lookup/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[orderNo]/route.ts`
- `src/app/api/orders/lookup/route.ts`
- `src/app/api/payments/callback/route.ts`
- `src/modules/catalog/*`
- `src/modules/order/*`
- `src/modules/payment/*`
- `src/modules/delivery/*`
- `src/modules/admin/*`
- `src/modules/risk/*`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `tests/unit/*`
- `tests/e2e/*`

### Task 1: Scaffold the app shell and brand system

**Files:**
- Create: `package.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/(public)/page.tsx`
- Test: `tests/unit/branding/brand-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { brandConfig } from "@/modules/catalog/brand-config";

describe("brandConfig", () => {
  it("exposes the chenfenpro site identity", () => {
    expect(brandConfig.name).toBe("chenfenpro");
    expect(brandConfig.tagline).toContain("自动发货");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/branding/brand-config.test.ts`
Expected: FAIL with module not found for `@/modules/catalog/brand-config`

- [ ] **Step 3: Write minimal implementation**

```ts
export const brandConfig = {
  name: "chenfenpro",
  tagline: "稳定、安全、自动发货的卡密商城",
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/branding/brand-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json src/app/layout.tsx src/app/globals.css src/app/(public)/page.tsx src/modules/catalog/brand-config.ts tests/unit/branding/brand-config.test.ts
git commit -m "feat: scaffold chenfenpro storefront shell"
```

### Task 2: Model products, stock, orders, and payments

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `src/modules/catalog/catalog.repository.ts`
- Test: `tests/unit/catalog/catalog.repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { mapFeaturedProduct } from "@/modules/catalog/catalog.repository";

describe("mapFeaturedProduct", () => {
  it("returns formatted inventory and pricing details", () => {
    const product = mapFeaturedProduct({
      id: "p1",
      name: "Steam 礼品卡 100",
      slug: "steam-100",
      price: 10000,
      _count: { stockItems: 12 },
    });

    expect(product.priceLabel).toBe("¥100.00");
    expect(product.stockLabel).toBe("库存 12");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/catalog/catalog.repository.test.ts`
Expected: FAIL with module not found for `catalog.repository`

- [ ] **Step 3: Write minimal implementation**

```ts
export function mapFeaturedProduct(product: {
  id: string;
  name: string;
  slug: string;
  price: number;
  _count: { stockItems: number };
}) {
  return {
    ...product,
    priceLabel: `¥${(product.price / 100).toFixed(2)}`,
    stockLabel: `库存 ${product._count.stockItems}`,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/catalog/catalog.repository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts src/lib/db.ts src/modules/catalog/catalog.repository.ts tests/unit/catalog/catalog.repository.test.ts
git commit -m "feat: add core commerce data model"
```

### Task 3: Build catalog and product-detail flows

**Files:**
- Create: `src/modules/catalog/catalog.service.ts`
- Create: `src/app/(public)/products/[slug]/page.tsx`
- Modify: `src/app/(public)/page.tsx`
- Test: `tests/unit/catalog/catalog.service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildHeroProducts } from "@/modules/catalog/catalog.service";

describe("buildHeroProducts", () => {
  it("prioritizes featured products first", () => {
    const result = buildHeroProducts([
      { slug: "a", isFeatured: false },
      { slug: "b", isFeatured: true },
    ]);

    expect(result.map((item) => item.slug)).toEqual(["b", "a"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/catalog/catalog.service.test.ts`
Expected: FAIL with missing export `buildHeroProducts`

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildHeroProducts<T extends { isFeatured: boolean }>(products: T[]) {
  return [...products].sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/catalog/catalog.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/catalog/catalog.service.ts src/app/(public)/products/[slug]/page.tsx src/app/(public)/page.tsx tests/unit/catalog/catalog.service.test.ts
git commit -m "feat: add storefront browsing experience"
```

### Task 4: Implement order creation, payment creation, and order lookup

**Files:**
- Create: `src/modules/order/order.service.ts`
- Create: `src/modules/payment/payment.adapter.ts`
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[orderNo]/route.ts`
- Create: `src/app/api/orders/lookup/route.ts`
- Create: `src/app/(public)/checkout/[orderNo]/page.tsx`
- Create: `src/app/(public)/orders/lookup/page.tsx`
- Test: `tests/unit/order/order.service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildOrderExpiry } from "@/modules/order/order.service";

describe("buildOrderExpiry", () => {
  it("returns a 15 minute expiry window", () => {
    const createdAt = new Date("2026-04-18T00:00:00.000Z");
    const expiresAt = buildOrderExpiry(createdAt);

    expect(expiresAt.toISOString()).toBe("2026-04-18T00:15:00.000Z");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/order/order.service.test.ts`
Expected: FAIL with missing export `buildOrderExpiry`

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildOrderExpiry(createdAt: Date) {
  return new Date(createdAt.getTime() + 15 * 60 * 1000);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/order/order.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/order/order.service.ts src/modules/payment/payment.adapter.ts src/app/api/orders/route.ts src/app/api/orders/[orderNo]/route.ts src/app/api/orders/lookup/route.ts src/app/(public)/checkout/[orderNo]/page.tsx src/app/(public)/orders/lookup/page.tsx tests/unit/order/order.service.test.ts
git commit -m "feat: add guest checkout and order lookup"
```

### Task 5: Implement payment callback, delivery engine, and admin operations

**Files:**
- Create: `src/modules/payment/payment-callback.service.ts`
- Create: `src/modules/delivery/delivery.service.ts`
- Create: `src/app/api/payments/callback/route.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/page.tsx`
- Test: `tests/unit/delivery/delivery.service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { formatDeliveryPayload } from "@/modules/delivery/delivery.service";

describe("formatDeliveryPayload", () => {
  it("masks card secrets for admin previews", () => {
    const payload = formatDeliveryPayload([
      { serialCode: "AAAA", secretCode: "1234567890" },
    ]);

    expect(payload.preview[0].secretCodeMasked).toBe("1234******");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/delivery/delivery.service.test.ts`
Expected: FAIL with missing export `formatDeliveryPayload`

- [ ] **Step 3: Write minimal implementation**

```ts
export function formatDeliveryPayload(items: Array<{ serialCode: string; secretCode: string }>) {
  return {
    preview: items.map((item) => ({
      serialCode: item.serialCode,
      secretCodeMasked: `${item.secretCode.slice(0, 4)}******`,
    })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/delivery/delivery.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/payment/payment-callback.service.ts src/modules/delivery/delivery.service.ts src/app/api/payments/callback/route.ts src/app/admin/login/page.tsx src/app/admin/page.tsx tests/unit/delivery/delivery.service.test.ts
git commit -m "feat: add payment callback delivery and admin tools"
```

### Task 6: Add verification, documentation, and deployment polish

**Files:**
- Create: `.env.example`
- Create: `README.md`
- Create: `tests/e2e/storefront.spec.ts`
- Create: `docker-compose.yml`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("home page shows chenfenpro hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /chenfenpro/i })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/storefront.spec.ts`
Expected: FAIL because the app server or page is not yet configured

- [ ] **Step 3: Write minimal implementation**

```md
# chenfenpro

真实可上线的一期自营卡密商城，支持游客下单、二维码支付、自动发货、订单查询和后台管理。
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/storefront.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md tests/e2e/storefront.spec.ts docker-compose.yml package.json
git commit -m "chore: document and verify chenfenpro mvp"
```

## Self-Review

- Spec coverage: public storefront, checkout, lookup, payment callback, delivery, admin, and deployment are all mapped to tasks.
- Placeholder scan: no unresolved placeholders or file paths remain.
- Type consistency: shared names use `brandConfig`, `mapFeaturedProduct`, `buildOrderExpiry`, and `formatDeliveryPayload` consistently across tasks.
