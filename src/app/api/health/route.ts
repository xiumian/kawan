import { NextResponse } from "next/server";

import {
  getLaunchReadiness,
  summarizeLaunchReadiness,
} from "@/modules/runtime/launch-readiness";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const strict = searchParams.get("strict") === "1";
  const readiness = getLaunchReadiness();
  const status = strict && !readiness.ready ? 503 : 200;

  return NextResponse.json(
    {
      ok: true,
      launchReady: readiness.ready,
      paymentProvider: readiness.paymentProvider,
      summary: summarizeLaunchReadiness(readiness),
      checks: readiness.checks,
      checkedAt: new Date().toISOString(),
    },
    { status },
  );
}
