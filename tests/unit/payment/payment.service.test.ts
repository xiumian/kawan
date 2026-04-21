import { describe, expect, it, vi } from "vitest";

describe("payment provider config", () => {
  it("creates an easypay-compatible payment session when configured", async () => {
    vi.resetModules();
    process.env.PAYMENT_PROVIDER = "easypay_compat";
    process.env.EASYPAY_SUBMIT_URL = "https://pay.example.com/submit.php";
    process.env.EASYPAY_PID = "10001";
    process.env.EASYPAY_KEY = "secret-key";
    delete process.env.EASYPAY_NOTIFY_URL;
    delete process.env.EASYPAY_RETURN_URL;

    const { createPaymentSession } = await import("@/modules/payment/payment.service");

    const session = await createPaymentSession({
      paymentNo: "PAY123",
      orderNo: "CF123",
      accessKey: "ACCESS123",
      amountFen: 10000,
      productName: "Steam Wallet 100",
      origin: "https://shop.example.com",
    });

    expect(session.provider).toBe("EASYPAY_COMPAT");
    expect(session.providerMerchantId).toBe("10001");
    expect(session.paymentUrl).toContain("https://pay.example.com/submit.php");
    expect(session.paymentUrl).toContain("out_trade_no=PAY123");
    expect(session.paymentUrl).toContain(
      "notify_url=https%3A%2F%2Fshop.example.com%2Fapi%2Fpayments%2Fcallback",
    );
    expect(session.paymentUrl).toContain(
      "return_url=https%3A%2F%2Fshop.example.com%2Fcheckout%2FCF123%3Fkey%3DACCESS123",
    );
  });

  it("defaults to mockpay when no provider is configured", async () => {
    vi.resetModules();
    delete process.env.PAYMENT_PROVIDER;

    const { getPaymentProviderName } = await import(
      "@/modules/payment/payment.config"
    );

    expect(getPaymentProviderName()).toBe("MOCKPAY");
  });

  it("resolves easypay-compatible when configured", async () => {
    vi.resetModules();
    process.env.PAYMENT_PROVIDER = "easypay_compat";

    const { getPaymentProviderName } = await import(
      "@/modules/payment/payment.config"
    );

    expect(getPaymentProviderName()).toBe("EASYPAY_COMPAT");
  });

  it("creates a qr data url from a payment url", async () => {
    const { buildCheckoutQrDataUrl } = await import(
      "@/modules/payment/payment.qr"
    );

    const qr = await buildCheckoutQrDataUrl("https://pay.example.com/session/123");

    expect(qr.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("normalizes a verified easypay callback", async () => {
    vi.resetModules();
    process.env.PAYMENT_PROVIDER = "easypay_compat";
    process.env.EASYPAY_SUBMIT_URL = "https://pay.example.com/submit.php";
    process.env.EASYPAY_PID = "10001";
    process.env.EASYPAY_KEY = "secret-key";

    const { verifyPaymentCallback } = await import(
      "@/modules/payment/payment.service"
    );

    const callback = verifyPaymentCallback({
      money: "100.00",
      name: "Steam Wallet 100",
      out_trade_no: "PAY123",
      pid: "10001",
      trade_no: "202604180001",
      trade_status: "TRADE_SUCCESS",
      type: "alipay",
      sign_type: "MD5",
      sign: "872f0e679d235ae9846e134d1d68c634",
    });

    expect(callback.provider).toBe("EASYPAY_COMPAT");
    expect(callback.paymentNo).toBe("PAY123");
    expect(callback.providerTradeNo).toBe("202604180001");
    expect(callback.providerMerchantId).toBe("10001");
    expect(callback.verified).toBe(true);
    expect(callback.paid).toBe(true);
    expect(callback.amountFen).toBe(10000);
  });
});
