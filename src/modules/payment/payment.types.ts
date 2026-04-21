export type PaymentProviderName = "MOCKPAY" | "EASYPAY_COMPAT";

export type CreatePaymentSessionInput = {
  paymentNo: string;
  orderNo: string;
  accessKey: string;
  amountFen: number;
  productName: string;
  origin?: string;
};

export type CreatePaymentSessionResult = {
  provider: PaymentProviderName;
  paymentUrl: string;
  providerMerchantId?: string;
  rawCreateResponse?: string;
};

export type VerifiedPaymentCallback = {
  provider: PaymentProviderName;
  paymentNo: string;
  providerTradeNo?: string;
  providerMerchantId?: string;
  paid: boolean;
  verified: boolean;
  rawPayload: string;
  amountFen?: number;
};
