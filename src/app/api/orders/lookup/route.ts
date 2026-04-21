import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  lookupOrder,
  serializeOrder,
} from "@/modules/order/order.repository";
import { lookupOrderSchema } from "@/modules/order/order.schemas";

export async function POST(request: Request) {
  try {
    const payload = lookupOrderSchema.parse(await request.json());
    const order = await lookupOrder(payload.orderNo, payload.verification);

    if (!order) {
      return NextResponse.json({ error: "未查到匹配订单" }, { status: 404 });
    }

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "查询失败" }, { status: 400 });
  }
}
