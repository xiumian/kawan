import { describe, expect, it } from "vitest";

import {
  buildEasypayPaymentUrl,
  buildEasypaySignature,
  isEasypayPaidStatus,
  verifyEasypaySignature,
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

    expect(sign).toBe("376df50daafe1d5951b71e4c0a83e12b");
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
      signType: "MD5",
    });

    expect(url).toContain("https://pay.example.com/submit.php");
    expect(url).toContain("pid=10001");
    expect(url).toContain("out_trade_no=PAY123");
    expect(url).toContain("sign=");
    expect(url).toContain("sign_type=MD5");
  });

  it("verifies callback signatures after excluding sign fields", () => {
    const payload = {
      money: "100.00",
      name: "Steam Wallet 100",
      out_trade_no: "PAY123",
      pid: "10001",
      trade_no: "202604180001",
      trade_status: "TRADE_SUCCESS",
      type: "alipay",
      sign_type: "MD5",
      sign: "872f0e679d235ae9846e134d1d68c634",
    };

    expect(verifyEasypaySignature(payload, "secret-key")).toBe(true);
  });

  it("treats TRADE_SUCCESS as a paid status", () => {
    expect(isEasypayPaidStatus("TRADE_SUCCESS")).toBe(true);
    expect(isEasypayPaidStatus("WAIT_BUYER_PAY")).toBe(false);
  });
});
