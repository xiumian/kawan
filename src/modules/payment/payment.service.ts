import {
  getEasypayReturnUrl,
  getPaymentNotifyUrl,
  getPaymentProviderName,
  getRequiredEasypayConfig,
} from "@/modules/payment/payment.config";
import {
  buildEasypayPaymentUrl,
  isEasypayPaidStatus,
  verifyEasypaySignature,
} from "@/modules/payment/easypay-compatible.service";
import { buildMockPaymentUrl } from "@/modules/payment/mockpay.service";
import type {
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  VerifiedPaymentCallback,
} from "@/modules/payment/payment.types";

export async function createPaymentSession(
  input: CreatePaymentSessionInput,
): Promise<CreatePaymentSessionResult> {
  const provider = getPaymentProviderName();

  if (provider === "MOCKPAY") {
    const paymentUrl = buildMockPaymentUrl(input.paymentNo, input.origin);

    return {
      provider,
      paymentUrl,
      rawCreateResponse: JSON.stringify({
        provider: "mockpay",
        paymentNo: input.paymentNo,
        paymentUrl,
      }),
    };
  }

  const config = getRequiredEasypayConfig();
  const paymentUrl = buildEasypayPaymentUrl({
    submitUrl: config.submitUrl,
    pid: config.pid,
    key: config.key,
    outTradeNo: input.paymentNo,
    name: input.productName,
    money: formatMoneyFen(input.amountFen),
    notifyUrl: getPaymentNotifyUrl(input.origin),
    returnUrl: getEasypayReturnUrl({
      orderNo: input.orderNo,
      accessKey: input.accessKey,
      origin: input.origin,
    }),
    paymentType: config.paymentType,
    signType: config.signType,
  });

  return {
    provider,
    paymentUrl,
    providerMerchantId: config.pid,
    rawCreateResponse: JSON.stringify({
      provider: "easypay_compat",
      paymentNo: input.paymentNo,
      paymentUrl,
      merchantId: config.pid,
    }),
  };
}

export function verifyPaymentCallback(
  payload: Record<string, string>,
): VerifiedPaymentCallback {
  const provider = getPaymentProviderName();

  if (provider !== "EASYPAY_COMPAT") {
    return {
      provider: "MOCKPAY",
      paymentNo: payload.out_trade_no ?? "",
      verified: false,
      paid: false,
      rawPayload: JSON.stringify(payload),
    };
  }

  const config = getRequiredEasypayConfig();
  const verified = verifyEasypaySignature(payload, config.key);

  return {
    provider,
    paymentNo: payload.out_trade_no ?? "",
    providerTradeNo: payload.trade_no,
    providerMerchantId: payload.pid,
    verified,
    paid: verified && isEasypayPaidStatus(payload.trade_status ?? ""),
    rawPayload: JSON.stringify(payload),
    amountFen: payload.money ? parseMoneyToFen(payload.money) : undefined,
  };
}

export function getCallbackPayloadFromEntries(
  entries: Iterable<[string, string]>,
) {
  return Object.fromEntries(Array.from(entries));
}

export function formatMoneyFen(amountFen: number) {
  return (amountFen / 100).toFixed(2);
}

function parseMoneyToFen(value: string) {
  return Math.round(Number(value) * 100);
}
