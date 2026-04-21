import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

const COOKIE_NAME = "chenfenpro_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function signPayload(payload: string) {
  return createHmac("sha256", env.adminSessionSecret)
    .update(payload)
    .digest("hex");
}

export function buildAdminSession(username: string) {
  const issuedAt = Date.now().toString();
  const payload = `${username}:${issuedAt}`;
  const signature = signPayload(payload);

  return `${payload}:${signature}`;
}

export function verifyAdminSession(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [username, issuedAt, signature] = token.split(":");

  if (!username || !issuedAt || !signature) {
    return false;
  }

  const payload = `${username}:${issuedAt}`;
  const expectedSignature = signPayload(payload);
  const isValid =
    Buffer.byteLength(signature) === Buffer.byteLength(expectedSignature) &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isValid) {
    return false;
  }

  return Date.now() - Number(issuedAt) <= SESSION_TTL_SECONDS * 1000;
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(COOKIE_NAME)?.value);
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export function getAdminSessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}
