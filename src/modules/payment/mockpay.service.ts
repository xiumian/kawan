import { buildAbsoluteUrl } from "@/lib/env";

export function buildMockPaymentUrl(paymentNo: string, origin?: string) {
  return buildAbsoluteUrl(`/pay/mock/${paymentNo}`, origin);
}
