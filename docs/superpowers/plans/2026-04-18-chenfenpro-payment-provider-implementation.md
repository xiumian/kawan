# chenfenpro Payment Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hard-coded mock payment path with a switchable payment provider architecture that keeps `mockpay` working and adds an `easypay-compatible` real payment adapter.

**Architecture:** Keep order creation, lookup, and delivery as the stable business core. Move payment session creation, checkout QR generation, and callback verification into a dedicated payment layer, then wire the order repository and callback route through that layer.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma, SQLite, Vitest, Zod

---

## Planned File Structure

- `prisma/schema.prisma`
- `src/lib/env.ts`
- `src/modules/payment/payment.types.ts`
- `src/modules/payment/payment.config.ts`
- `src/modules/payment/payment.qr.ts`
- `src/modules/payment/payment.registry.ts`
- `src/modules/payment/payment.service.ts`
- `src/modules/payment/mockpay.service.ts`
- `src/modules/payment/easypay-compatible.service.ts`
- `src/modules/order/order.repository.ts`
- `src/modules/order/order.schemas.ts`
- `src/app/api/payments/callback/route.ts`
- `src/app/(public)/checkout/[orderNo]/page.tsx`
- `src/components/checkout-status.tsx`
- `.env.example`
- `README.md`
- `tests/unit/payment/payment.service.test.ts`
- `tests/unit/payment/easypay-compatible.service.test.ts`
- `tests/unit/order/order.repository.test.ts`

### Task 1: Add provider config and provider primitives

**Files:**
- Create: `src/modules/payment/payment.types.ts`
- Create: `src/modules/payment/payment.config.ts`
- Create: `src/modules/payment/payment.registry.ts`
- Modify: `src/lib/env.ts`
- Create: `tests/unit/payment/payment.service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it, vi } from "vitest";

describe("payment provider config", () => {
  it("defaults to mockpay when no provider is configured", async () => {
    vi.resetModules();
    delete process.env.PAYMENT_PROVIDER;

    const { getPaymentProviderName } = await import("@/modules/payment/payment.config");

    expect(getPaymentProviderName()).toBe("MOCKPAY");
  });

  it("resolves easypay-compatible when configured", async () => {
    vi.resetModules();
    process.env.PAYMENT_PROVIDER = "easypay_compat";

    const { getPaymentProviderName } = await import("@/modules/payment/payment.config");

    expect(getPaymentProviderName()).toBe("EASYPAY_COMPAT");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/payment/payment.service.test.ts`
Expected: FAIL because the payment config module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type PaymentProviderName = "MOCKPAY" | "EASYPAY_COMPAT";
```

```ts
import { env } from "@/lib/env";
import type { PaymentProviderName } from "@/modules/payment/payment.types";

export function getPaymentProviderName(): PaymentProviderName {
  return env.paymentProvider === "easypay_compat"
    ? "EASYPAY_COMPAT"
    : "MOCKPAY";
}
```

```ts
const DEFAULT_BASE_URL = "http://localhost:3000";

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_BASE_URL,
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "chenfenpro123",
  adminSessionSecret:
    process.env.ADMIN_SESSION_SECRET ?? "chenfenpro-local-session-secret",
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mockpay",
  paymentNotifyPath: process.env.PAYMENT_NOTIFY_PATH ?? "/api/payments/callback",
  easypaySubmitUrl: process.env.EASYPAY_SUBMIT_URL ?? "",
  easypayPid: process.env.EASYPAY_PID ?? "",
  easypayKey: process.env.EASYPAY_KEY ?? "",
  easypaySignType: process.env.EASYPAY_SIGN_TYPE ?? "MD5",
  easypayReturnUrl: process.env.EASYPAY_RETURN_URL ?? "",
  easypayNotifyUrl: process.env.EASYPAY_NOTIFY_URL ?? "",
  easypayPaymentType: process.env.EASYPAY_PAYMENT_TYPE ?? "alipay",
} as const;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/payment/payment.service.test.ts`
Expected: PASS

### Task 2: Implement easypay-compatible signing and create-payment builder

**Files:**
- Create: `src/modules/payment/easypay-compatible.service.ts`
- Create: `tests/unit/payment/easypay-compatible.service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";

import {
  buildEasypaySignature,
  buildEasypayPaymentUrl,
} from "@/modules/payment/easypay-compatible.service";

describe("easypay-compatible service", () => {
  it("creates a deterministic md5 signature from sorted fields", () => {
    const sign = buildEasypaySignature(
      {
        money: "100.00",
        name: "Steam Wallet 100",
        notify_url: "https://example.com/callback",
        out_trade_no: "PAY123",
        pid: "10001",
        return_url: "https://example.com/return",
        type: "alipay",
      },
      "secret-key",
    );

    expect(sign).toHaveLength(32);
  });

  it("builds a submit url carrying pid, out_trade_no and sign", () => {
    const url = buildEasypayPaymentUrl({
      submitUrl: "https://pay.example.com/submit.php",
      pid: "10001",
      key: "secret-key",
      outTradeNo: "PAY123",
      name: "Steam Wallet 100",
      money: "100.00",
      notifyUrl: "https://shop.example.com/api/payments/callback",
      returnUrl: "https://shop.example.com/orders/lookup",
      paymentType: "alipay",
    });

    expect(url).toContain("submit.php");
    expect(url).toContain("pid=10001");
    expect(url).toContain("out_trade_no=PAY123");
    expect(url).toContain("sign=");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/payment/easypay-compatible.service.test.ts`
Expected: FAIL because the service does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import { createHash } from "node:crypto";

function sortAndJoin(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function buildEasypaySignature(
  params: Record<string, string>,
  key: string,
) {
  return createHash("md5")
    .update(`${sortAndJoin(params)}${key}`)
    .digest("hex");
}

export function buildEasypayPaymentUrl(input: {
  submitUrl: string;
  pid: string;
  key: string;
  outTradeNo: string;
  name: string;
  money: string;
  notifyUrl: string;
  returnUrl: string;
  paymentType: string;
}) {
  const params = {
    pid: input.pid,
    type: input.paymentType,
    out_trade_no: input.outTradeNo,
    notify_url: input.notifyUrl,
    return_url: input.returnUrl,
    name: input.name,
    money: input.money,
  };
  const sign = buildEasypaySignature(params, input.key);
  const search = new URLSearchParams({
    ...params,
    sign_type: "MD5",
    sign,
  });
  return `${input.submitUrl}?${search.toString()}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/payment/easypay-compatible.service.test.ts`
Expected: PASS

### Task 3: Add unified payment service and QR generation

**Files:**
- Create: `src/modules/payment/payment.qr.ts`
- Create: `src/modules/payment/payment.service.ts`
- Modify: `src/modules/payment/mockpay.service.ts`
- Modify: `tests/unit/payment/payment.service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";

import { buildCheckoutQrDataUrl } from "@/modules/payment/payment.qr";

describe("payment qr", () => {
  it("creates a data url from a payment url", async () => {
    const qr = await buildCheckoutQrDataUrl("https://pay.example.com/session/123");

    expect(qr.startsWith("data:image/png;base64,")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/payment/payment.service.test.ts`
Expected: FAIL because the QR helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import QRCode from "qrcode";

export async function buildCheckoutQrDataUrl(paymentUrl: string) {
  return QRCode.toDataURL(paymentUrl, {
    margin: 1,
    width: 320,
    color: {
      dark: "#d9fbff",
      light: "#071217",
    },
  });
}
```

```ts
import { buildAbsoluteUrl } from "@/lib/env";

export function buildMockPaymentUrl(paymentNo: string, origin?: string) {
  return buildAbsoluteUrl(`/pay/mock/${paymentNo}`, origin);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/payment/payment.service.test.ts`
Expected: PASS

### Task 4: Refactor order creation to use provider-selected payment session creation

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/modules/order/order.repository.ts`
- Modify: `src/modules/order/order.schemas.ts`
- Create: `tests/unit/order/order.repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { normalizeLookupKey } from "@/modules/order/order.service";

describe("order repository payment integration", () => {
  it("keeps email lookup normalization stable for real-provider orders", () => {
    expect(normalizeLookupKey("buyer@example.com")).toBe("buyer@example.com");
  });
});
```

- [ ] **Step 2: Run tests to verify baseline**

Run: `npm run test -- tests/unit/order/order.repository.test.ts`
Expected: FAIL because the test file does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```prisma
enum PaymentProvider {
  MOCKPAY
  EASYPAY_COMPAT
}
```

```prisma
model PaymentOrder {
  id                 String          @id @default(cuid())
  orderId            String
  paymentNo          String          @unique
  provider           PaymentProvider @default(MOCKPAY)
  providerTradeNo    String?
  providerMerchantId String?
  paymentUrl         String
  amount             Int
  status             PaymentStatus   @default(CREATED)
  rawCreateResponse  String?
  rawCallbackPayload String?
  callbackVerified   Boolean         @default(false)
  paidAt             DateTime?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  order              Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  callbackLogs       CallbackLog[]

  @@index([orderId, status])
}
```

```ts
const paymentSession = await createPaymentSession({
  paymentNo,
  orderNo: order.orderNo,
  amount: order.amount,
  productName: product.name,
  origin: input.origin,
});

await tx.paymentOrder.create({
  data: {
    orderId: order.id,
    paymentNo,
    provider: paymentSession.provider,
    providerMerchantId: paymentSession.providerMerchantId,
    paymentUrl: paymentSession.paymentUrl,
    amount: order.amount,
    status: PaymentStatus.WAITING,
    rawCreateResponse: paymentSession.rawCreateResponse,
  },
});
```

- [ ] **Step 4: Run tests and schema sync**

Run: `npm run test -- tests/unit/order/order.repository.test.ts`
Expected: PASS

Run: `npm run db:push`
Expected: PASS and SQLite schema updated

### Task 5: Replace callback placeholder with verified provider callback handling

**Files:**
- Modify: `src/app/api/payments/callback/route.ts`
- Modify: `src/modules/payment/payment.service.ts`
- Modify: `src/modules/order/order.repository.ts`
- Modify: `tests/unit/payment/easypay-compatible.service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { isEasypayPaidStatus } from "@/modules/payment/easypay-compatible.service";

describe("easypay callback", () => {
  it("treats TRADE_SUCCESS as a paid status", () => {
    expect(isEasypayPaidStatus("TRADE_SUCCESS")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/payment/easypay-compatible.service.test.ts`
Expected: FAIL because the callback helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function isEasypayPaidStatus(status: string) {
  return status === "TRADE_SUCCESS" || status === "TRADE_FINISHED";
}
```

```ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  );

  const callback = await verifyPaymentCallback(payload);

  if (!callback.verified) {
    return new Response("fail", { status: 400 });
  }

  await confirmProviderPayment(callback);

  return new Response("success");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/unit/payment/easypay-compatible.service.test.ts`
Expected: PASS

### Task 6: Make checkout generic across providers

**Files:**
- Modify: `src/app/(public)/checkout/[orderNo]/page.tsx`
- Modify: `src/components/checkout-status.tsx`

- [ ] **Step 1: Write the failing test**

No new test file is required here; extend the existing payment QR coverage and use smoke validation after implementation.

- [ ] **Step 2: Write minimal implementation**

```ts
const paymentUrl = order.paymentOrders[0]?.paymentUrl ?? null;
const qrCodeDataUrl = paymentUrl ? await buildCheckoutQrDataUrl(paymentUrl) : null;
```

```tsx
<p className="text-sm leading-7 text-slate-400">
  当前订单已生成支付会话。扫码或打开支付页完成付款，结算页会自动同步支付与发货状态。
</p>
```

- [ ] **Step 3: Run verification**

Run: `npm run test`
Expected: PASS

### Task 7: Update docs and env examples for launch-ready payment config

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Write minimal documentation changes**

```env
PAYMENT_PROVIDER="mockpay"
PAYMENT_NOTIFY_PATH="/api/payments/callback"
EASYPAY_SUBMIT_URL=""
EASYPAY_PID=""
EASYPAY_KEY=""
EASYPAY_SIGN_TYPE="MD5"
EASYPAY_RETURN_URL=""
EASYPAY_NOTIFY_URL=""
EASYPAY_PAYMENT_TYPE="alipay"
```

```md
## 支付通道

- 开发环境默认使用 `mockpay`
- 生产环境可切换到 `easypay-compatible`
- 真正上线前必须配置商户号、密钥和公网回调地址
```

- [ ] **Step 2: Run final verification**

Run: `npm run test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

Run: local smoke flow
Expected: create order -> checkout -> confirm payment -> lookup delivery all still work

## Self-Review

- Spec coverage: provider abstraction, mockpay retention, easypay-compatible adapter, callback verification, checkout generic QR flow, and launch docs are all mapped to tasks.
- Placeholder scan: no TODO/TBD placeholders remain in steps.
- Type consistency: provider names, callback fields, and payment session fields are consistent across tasks.
