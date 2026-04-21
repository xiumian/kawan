import { NextResponse } from "next/server";

import {
  getOrderByNo,
  serializeOrder,
} from "@/modules/order/order.repository";

type RouteProps = {
  params: Promise<{ orderNo: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { orderNo } = await params;
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const order = await getOrderByNo(orderNo);

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (order.accessKey !== key) {
    return NextResponse.json({ error: "无权访问该订单" }, { status: 403 });
  }

  return NextResponse.json({ order: serializeOrder(order) });
}
