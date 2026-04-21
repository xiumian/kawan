import { describe, expect, it } from "vitest";

import { getLaunchReadiness } from "@/modules/runtime/launch-readiness";

describe("launch-readiness", () => {
  it("flags default local credentials and mockpay as launch blockers", () => {
    const readiness = getLaunchReadiness({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "chenfenpro123",
      ADMIN_SESSION_SECRET: "chenfenpro-local-session-secret",
      PAYMENT_PROVIDER: "mockpay",
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.checks.filter((item) => item.status === "fail")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "site-url" }),
        expect.objectContaining({ code: "admin-credentials" }),
        expect.objectContaining({ code: "admin-session-secret" }),
        expect.objectContaining({ code: "payment-provider" }),
      ]),
    );
  });

  it("requires easypay merchant credentials when using easypay-compatible mode", () => {
    const readiness = getLaunchReadiness({
      NEXT_PUBLIC_SITE_URL: "https://shop.example.com",
      ADMIN_USERNAME: "ops",
      ADMIN_PASSWORD: "strong-password-001",
      ADMIN_SESSION_SECRET: "very-strong-admin-session-secret-001",
      PAYMENT_PROVIDER: "easypay_compat",
      EASYPAY_SUBMIT_URL: "https://pay.example.com/submit.php",
      EASYPAY_PID: "10001",
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.checks).toContainEqual(
      expect.objectContaining({
        code: "easypay-credentials",
        status: "fail",
      }),
    );
  });

  it("passes when real launch configuration is present", () => {
    const readiness = getLaunchReadiness({
      NEXT_PUBLIC_SITE_URL: "https://shop.example.com",
      ADMIN_USERNAME: "ops",
      ADMIN_PASSWORD: "strong-password-001",
      ADMIN_SESSION_SECRET: "very-strong-admin-session-secret-001",
      PAYMENT_PROVIDER: "easypay_compat",
      EASYPAY_SUBMIT_URL: "https://pay.example.com/submit.php",
      EASYPAY_PID: "10001",
      EASYPAY_KEY: "merchant-secret-key",
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.checks.some((item) => item.status === "fail")).toBe(false);
  });
});
