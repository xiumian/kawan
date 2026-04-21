import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  createOrder,
  serializeOrder,
} from "@/modules/order/order.repository";
import { createOrderSchema } from "@/modules/order/order.schemas";

export async function POST(request: Request) {
  try {
    const payload = createOrderSchema.parse(await request.json());
    const order = await createOrder({
      ...payload,
      customerEmail: payload.customerEmail || undefined,
      customerPhone: payload.customerPhone || undefined,
      origin: new URL(request.url).origin,
    });

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建订单失败" },
      { status: 400 },
    );
  }
}
