import { buildAbsoluteUrl, env } from "@/lib/env";
import type { PaymentProviderName } from "@/modules/payment/payment.types";

export function getPaymentProviderName(): PaymentProviderName {
  return env.paymentProvider === "easypay_compat"
    ? "EASYPAY_COMPAT"
    : "MOCKPAY";
}

export function getPaymentNotifyUrl(origin?: string) {
  return env.easypayNotifyUrl || buildAbsoluteUrl(env.paymentNotifyPath, origin);
}

export function getEasypayReturnUrl(input: {
  orderNo: string;
  accessKey: string;
  origin?: string;
}) {
  return (
    env.easypayReturnUrl ||
    buildAbsoluteUrl(
      `/checkout/${input.orderNo}?key=${input.accessKey}`,
      input.origin,
    )
  );
}

export function getRequiredEasypayConfig() {
  if (!env.easypaySubmitUrl || !env.easypayPid || !env.easypayKey) {
    throw new Error("易支付通道配置不完整");
  }

  return {
    submitUrl: env.easypaySubmitUrl,
    pid: env.easypayPid,
    key: env.easypayKey,
    signType: env.easypaySignType,
    paymentType: env.easypayPaymentType,
  };
}
