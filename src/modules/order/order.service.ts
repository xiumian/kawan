import { randomUUID } from "node:crypto";

export function buildOrderExpiry(createdAt: Date) {
  return new Date(createdAt.getTime() + 15 * 60 * 1000);
}

export function buildOrderNo(createdAt: Date, suffix = randomUUID()) {
  const compactDate = createdAt
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  return `CF${compactDate}${suffix.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}`;
}

export function normalizeLookupKey(value: string) {
  const cleaned = value.trim();

  if (cleaned.includes("@")) {
    return cleaned.toLowerCase();
  }

  return cleaned.slice(-4);
}

export function buildPaymentNo(createdAt: Date, suffix = randomUUID()) {
  return `PAY${createdAt
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14)}${suffix.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()}`;
}

export function buildDeliveryCode(createdAt: Date, suffix = randomUUID()) {
  return `DLV${createdAt
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14)}${suffix.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()}`;
}
