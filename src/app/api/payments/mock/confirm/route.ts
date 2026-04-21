import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  confirmMockPayment,
  serializeOrder,
} from "@/modules/order/order.repository";
import { confirmMockPaymentSchema } from "@/modules/order/order.schemas";

export async function POST(request: Request) {
  try {
    const payload = confirmMockPaymentSchema.parse(await request.json());
    const order = await confirmMockPayment(payload.paymentNo);

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "支付确认失败" },
      { status: 400 },
    );
  }
}
