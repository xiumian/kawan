type LaunchCheckStatus = "pass" | "warn" | "fail";

export type LaunchReadinessCheck = {
  code: string;
  label: string;
  message: string;
  status: LaunchCheckStatus;
};

export type LaunchReadiness = {
  ready: boolean;
  paymentProvider: string;
  checks: LaunchReadinessCheck[];
};

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "chenfenpro123";
const DEFAULT_ADMIN_SESSION_SECRET = "chenfenpro-local-session-secret";

export function getLaunchReadiness(
  rawEnv: NodeJS.ProcessEnv = process.env,
): LaunchReadiness {
  const paymentProvider = normalizePaymentProvider(rawEnv.PAYMENT_PROVIDER);
  const checks: LaunchReadinessCheck[] = [
    getSiteUrlCheck(rawEnv),
    getAdminCredentialsCheck(rawEnv),
    getAdminSessionSecretCheck(rawEnv),
    getPaymentProviderCheck(paymentProvider),
    getEasypayCredentialCheck(rawEnv, paymentProvider),
    getOpsCronTokenCheck(rawEnv),
  ];

  return {
    ready: checks.every((item) => item.status !== "fail"),
    paymentProvider,
    checks,
  };
}

export function summarizeLaunchReadiness(readiness: LaunchReadiness) {
  const failedChecks = readiness.checks.filter((item) => item.status === "fail");

  if (failedChecks.length === 0) {
    return "上线前置检查通过";
  }

  return `存在 ${failedChecks.length} 项上线阻塞`;
}

function getSiteUrlCheck(rawEnv: NodeJS.ProcessEnv): LaunchReadinessCheck {
  const siteUrl = rawEnv.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

  if (!siteUrl || siteUrl === DEFAULT_SITE_URL) {
    return {
      code: "site-url",
      label: "站点地址",
      status: "fail",
      message: "必须改成公网 HTTPS 域名，不能继续使用本地默认地址",
    };
  }

  if (!siteUrl.startsWith("https://")) {
    return {
      code: "site-url",
      label: "站点地址",
      status: "fail",
      message: "生产站点必须使用 HTTPS 地址",
    };
  }

  return {
    code: "site-url",
    label: "站点地址",
    status: "pass",
    message: `当前站点地址：${siteUrl}`,
  };
}

function getAdminCredentialsCheck(
  rawEnv: NodeJS.ProcessEnv,
): LaunchReadinessCheck {
  const username = rawEnv.ADMIN_USERNAME?.trim() ?? DEFAULT_ADMIN_USERNAME;
  const password = rawEnv.ADMIN_PASSWORD?.trim() ?? DEFAULT_ADMIN_PASSWORD;

  if (
    username === DEFAULT_ADMIN_USERNAME ||
    password === DEFAULT_ADMIN_PASSWORD
  ) {
    return {
      code: "admin-credentials",
      label: "后台账号",
      status: "fail",
      message: "后台仍在使用默认账号或默认密码，生产前必须替换",
    };
  }

  return {
    code: "admin-credentials",
    label: "后台账号",
    status: "pass",
    message: "后台账号已改为自定义凭证",
  };
}

function getAdminSessionSecretCheck(
  rawEnv: NodeJS.ProcessEnv,
): LaunchReadinessCheck {
  const secret =
    rawEnv.ADMIN_SESSION_SECRET?.trim() ?? DEFAULT_ADMIN_SESSION_SECRET;

  if (
    secret === DEFAULT_ADMIN_SESSION_SECRET ||
    secret.length < 24
  ) {
    return {
      code: "admin-session-secret",
      label: "后台会话密钥",
      status: "fail",
      message: "后台会话密钥仍是默认值或长度过短",
    };
  }

  return {
    code: "admin-session-secret",
    label: "后台会话密钥",
    status: "pass",
    message: "后台会话密钥已满足生产要求",
  };
}

function getPaymentProviderCheck(
  paymentProvider: string,
): LaunchReadinessCheck {
  if (paymentProvider === "MOCKPAY") {
    return {
      code: "payment-provider",
      label: "支付通道",
      status: "fail",
      message: "当前仍是 mockpay 演示通道，不能直接上线收款",
    };
  }

  if (paymentProvider !== "EASYPAY_COMPAT") {
    return {
      code: "payment-provider",
      label: "支付通道",
      status: "fail",
      message: "支付通道配置无效",
    };
  }

  return {
    code: "payment-provider",
    label: "支付通道",
    status: "pass",
    message: "已切换到真实支付兼容通道",
  };
}

function getEasypayCredentialCheck(
  rawEnv: NodeJS.ProcessEnv,
  paymentProvider: string,
): LaunchReadinessCheck {
  if (paymentProvider !== "EASYPAY_COMPAT") {
    return {
      code: "easypay-credentials",
      label: "支付商户参数",
      status: "warn",
      message: "当前未启用 easypay-compatible，商户参数检查已跳过",
    };
  }

  if (
    !rawEnv.EASYPAY_SUBMIT_URL?.trim() ||
    !rawEnv.EASYPAY_PID?.trim() ||
    !rawEnv.EASYPAY_KEY?.trim()
  ) {
    return {
      code: "easypay-credentials",
      label: "支付商户参数",
      status: "fail",
      message: "缺少支付网关地址、商户号或商户密钥",
    };
  }

  return {
    code: "easypay-credentials",
    label: "支付商户参数",
    status: "pass",
    message: "支付商户参数已配置",
  };
}

function getOpsCronTokenCheck(rawEnv: NodeJS.ProcessEnv): LaunchReadinessCheck {
  if (!rawEnv.OPS_CRON_TOKEN?.trim()) {
    return {
      code: "ops-cron-token",
      label: "运维计划任务密钥",
      status: "warn",
      message: "未配置 OPS_CRON_TOKEN，定时关单接口将无法安全暴露",
    };
  }

  return {
    code: "ops-cron-token",
    label: "运维计划任务密钥",
    status: "pass",
    message: "已配置运维计划任务密钥",
  };
}

function normalizePaymentProvider(rawProvider?: string) {
  return rawProvider === "easypay_compat" ? "EASYPAY_COMPAT" : "MOCKPAY";
}
