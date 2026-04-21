import { createHash } from "node:crypto";

function normalizeSignableParams(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([key, value]) => key !== "sign" && key !== "sign_type" && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function buildEasypaySignature(
  params: Record<string, string>,
  key: string,
) {
  return createHash("md5")
    .update(`${normalizeSignableParams(params)}${key}`)
    .digest("hex");
}

export function verifyEasypaySignature(
  params: Record<string, string>,
  key: string,
) {
  if (!params.sign) {
    return false;
  }

  return buildEasypaySignature(params, key) === params.sign.toLowerCase();
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
  signType: string;
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
    sign_type: input.signType,
    sign,
  });

  return `${input.submitUrl}?${search.toString()}`;
}

export function isEasypayPaidStatus(status: string) {
  return status === "TRADE_SUCCESS" || status === "TRADE_FINISHED";
}
