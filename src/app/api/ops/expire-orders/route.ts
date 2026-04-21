import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { expirePendingOrders } from "@/modules/order/order-lifecycle.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = request.headers.get("x-cron-token");

  if (!env.opsCronToken || token !== env.opsCronToken) {
    return NextResponse.json({ error: "无权执行计划任务" }, { status: 401 });
  }

  const expiredCount = await expirePendingOrders();

  return NextResponse.json({
    ok: true,
    expiredCount,
    executedAt: new Date().toISOString(),
  });
}
