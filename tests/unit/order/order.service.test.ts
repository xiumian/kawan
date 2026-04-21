import { describe, expect, it } from "vitest";

import {
  buildOrderExpiry,
  buildOrderNo,
  normalizeLookupKey,
} from "@/modules/order/order.service";

describe("order.service", () => {
  it("returns a 15 minute expiry window", () => {
    const createdAt = new Date("2026-04-18T00:00:00.000Z");
    const expiresAt = buildOrderExpiry(createdAt);

    expect(expiresAt.toISOString()).toBe("2026-04-18T00:15:00.000Z");
  });

  it("creates prefixed order numbers", () => {
    const orderNo = buildOrderNo(
      new Date("2026-04-18T08:09:10.000Z"),
      "abc12345",
    );

    expect(orderNo).toBe("CF20260418080910ABC12345");
  });

  it("normalizes lookup verification sources", () => {
    expect(normalizeLookupKey(" USER@Example.com ")).toBe("user@example.com");
    expect(normalizeLookupKey("13800138000")).toBe("8000");
  });
});
