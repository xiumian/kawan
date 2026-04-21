const DEFAULT_BASE_URL = "http://localhost:3000";

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_BASE_URL,
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "chenfenpro123",
  adminSessionSecret:
    process.env.ADMIN_SESSION_SECRET ?? "chenfenpro-local-session-secret",
  opsCronToken: process.env.OPS_CRON_TOKEN ?? "",
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

export function buildAbsoluteUrl(path: string, origin?: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, origin ?? env.siteUrl).toString();
}
