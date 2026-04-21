import { loadEnvConfig } from "@next/env";

import {
  getLaunchReadiness,
  summarizeLaunchReadiness,
} from "../src/modules/runtime/launch-readiness";

loadEnvConfig(process.cwd());

const readiness = getLaunchReadiness();
const failingChecks = readiness.checks.filter((item) => item.status === "fail");
const warningChecks = readiness.checks.filter((item) => item.status === "warn");

if (failingChecks.length > 0) {
  console.error(`[launch-check] ${summarizeLaunchReadiness(readiness)}`);

  for (const check of failingChecks) {
    console.error(`- FAIL ${check.label}: ${check.message}`);
  }

  for (const check of warningChecks) {
    console.error(`- WARN ${check.label}: ${check.message}`);
  }

  process.exit(1);
}

console.log(`[launch-check] ${summarizeLaunchReadiness(readiness)}`);

for (const check of readiness.checks) {
  const prefix = check.status.toUpperCase();
  const stream = check.status === "warn" ? console.warn : console.log;
  stream(`- ${prefix} ${check.label}: ${check.message}`);
}
