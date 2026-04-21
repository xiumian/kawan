import {
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
  StockStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatDeliveryPayload } from "@/modules/delivery/delivery.service";
import { expireOrderIfNeeded } from "@/modules/order/order-lifecycle.service";
import {
  buildDeliveryCode,
  buildOrderExpiry,
  buildOrderNo,
  buildPaymentNo,
  normalizeLookupKey,
} from "@/modules/order/order.service";
import {
  createPaymentSession,
} from "@/modules/payment/payment.service";
import type { VerifiedPaymentCallback } from "@/modules/payment/payment.types";

const orderWithRelations = Prisma.validator<Prisma.OrderDefaultArgs>()({
  include: {
    product: true,
    paymentOrders: {
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    },
    deliveries: {
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    },
  },
});

export type OrderWithRelations = Prisma.OrderGetPayload<typeof orderWithRelations>;

export async function createOrder(input: {
  productId: string;
  quantity: number;
  customerEmail?: string;
  customerPhone?: string;
  origin?: string;
}) {
  const createdAt = new Date();
  const expiresAt = buildOrderExpiry(createdAt);
  const lookupSource = input.customerEmail || input.customerPhone || "";
  const lookupKey = normalizeLookupKey(lookupSource);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: input.productId },
      include: {
        _count: {
          select: {
            stockItems: {
              where: {
                status: StockStatus.AVAILABLE,
              },
            },
          },
        },
      },
    });

    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new Error("商品不可购买");
    }

    if (
      input.quantity < product.purchaseLimitMin ||
      input.quantity > product.purchaseLimitMax
    ) {
      throw new Error("购买数量不在允许范围内");
    }

    if (product._count.stockItems < input.quantity) {
      throw new Error("库存不足");
    }

    const order = await tx.order.create({
      data: {
        orderNo: buildOrderNo(createdAt),
        productId: product.id,
        quantity: input.quantity,
        amount: product.price * input.quantity,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        lookupKey,
        expiresAt,
      },
    });

    const paymentNo = buildPaymentNo(createdAt);
    const paymentSession = await createPaymentSession({
      paymentNo,
      orderNo: order.orderNo,
      accessKey: order.accessKey,
      amountFen: order.amount,
      productName: product.name,
      origin: input.origin,
    });

    await tx.paymentOrder.create({
      data: {
        orderId: order.id,
        paymentNo,
        provider: paymentSession.provider,
        providerMerchantId: paymentSession.providerMerchantId,
        paymentUrl: paymentSession.paymentUrl,
        amount: order.amount,
        status: PaymentStatus.WAITING,
        rawCreateResponse: paymentSession.rawCreateResponse,
      },
    });

    const createdOrder = await getOrderByNo(order.orderNo, tx);

    if (!createdOrder) {
      throw new Error("订单创建后读取失败");
    }

    return createdOrder;
  });
}

export async function getOrderByNo(
  orderNo: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await expireOrderIfNeeded(orderNo, client as Parameters<typeof expireOrderIfNeeded>[1]);

  return client.order.findUnique({
    where: { orderNo },
    ...orderWithRelations,
  });
}

export async function lookupOrder(orderNo: string, verification: string) {
  const order = await getOrderByNo(orderNo);

  if (!order) {
    return null;
  }

  if (order.lookupKey !== normalizeLookupKey(verification)) {
    return null;
  }

  return order;
}

export async function confirmMockPayment(paymentNo: string) {
  return prisma.$transaction(async (tx) => {
    const paymentOrder = await tx.paymentOrder.findUnique({
      where: { paymentNo },
      include: { order: true },
    });

    if (!paymentOrder) {
      throw new Error("支付单不存在");
    }

    if (paymentOrder.status === PaymentStatus.PAID) {
      await tx.callbackLog.create({
        data: {
          paymentOrderId: paymentOrder.id,
          provider: "mockpay",
          payload: JSON.stringify({ paymentNo, event: "payment.confirmed" }),
          verified: true,
          processed: true,
          result: "duplicate",
        },
      });
      return getOrderByNo(paymentOrder.order.orderNo, tx);
    }

    return applySuccessfulPayment(tx, paymentOrder, {
      providerLabel: "mockpay",
      rawPayload: JSON.stringify({
        paymentNo,
        paidAt: new Date().toISOString(),
        provider: "mockpay",
      }),
      verified: true,
    });
  });
}

export async function recordPaymentCallbackFailure(input: {
  paymentNo: string;
  providerLabel: string;
  payload: string;
  verified: boolean;
  result: string;
}) {
  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { paymentNo: input.paymentNo },
  });

  if (!paymentOrder) {
    return;
  }

  await prisma.callbackLog.create({
    data: {
      paymentOrderId: paymentOrder.id,
      provider: input.providerLabel,
      payload: input.payload,
      verified: input.verified,
      processed: false,
      result: input.result,
    },
  });
}

export async function confirmVerifiedPaymentCallback(
  callback: VerifiedPaymentCallback,
) {
  return prisma.$transaction(async (tx) => {
    const paymentOrder = await tx.paymentOrder.findUnique({
      where: { paymentNo: callback.paymentNo },
      include: { order: true },
    });

    if (!paymentOrder) {
      throw new Error("支付单不存在");
    }

    if (
      callback.providerMerchantId &&
      paymentOrder.providerMerchantId &&
      callback.providerMerchantId !== paymentOrder.providerMerchantId
    ) {
      throw new Error("回调商户号不匹配");
    }

    if (
      typeof callback.amountFen === "number" &&
      paymentOrder.amount !== callback.amountFen
    ) {
      throw new Error("回调金额与订单金额不一致");
    }

    if (!callback.paid) {
      throw new Error("当前回调不是支付成功状态");
    }

    if (paymentOrder.status === PaymentStatus.PAID) {
      await tx.callbackLog.create({
        data: {
          paymentOrderId: paymentOrder.id,
          provider: callback.provider,
          payload: callback.rawPayload,
          verified: true,
          processed: true,
          result: "duplicate",
        },
      });
      return getOrderByNo(paymentOrder.order.orderNo, tx);
    }

    return applySuccessfulPayment(tx, paymentOrder, {
      providerLabel: callback.provider,
      rawPayload: callback.rawPayload,
      verified: callback.verified,
      providerTradeNo: callback.providerTradeNo,
      providerMerchantId: callback.providerMerchantId,
    });
  });
}

async function deliverOrder(
  orderId: string,
  tx: Prisma.TransactionClient,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      product: true,
    },
  });

  if (!order) {
    throw new Error("订单不存在");
  }

  if (order.status !== OrderStatus.PAID_PENDING_DELIVERY) {
    return;
  }

  const stockItems = await tx.stockItem.findMany({
    where: {
      productId: order.productId,
      status: StockStatus.AVAILABLE,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: order.quantity,
  });

  if (stockItems.length < order.quantity) {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.EXCEPTION,
        failureReason: "支付成功，但库存不足，需人工处理",
      },
    });
    return;
  }

  const soldAt = new Date();

  await tx.stockItem.updateMany({
    where: {
      id: {
        in: stockItems.map((item) => item.id),
      },
    },
    data: {
      status: StockStatus.SOLD,
      soldAt,
      orderId: order.id,
    },
  });

  await tx.delivery.create({
    data: {
      orderId: order.id,
      deliveryCode: buildDeliveryCode(soldAt),
      status: DeliveryStatus.DELIVERED,
      deliveredAt: soldAt,
      payloadSnapshot: JSON.stringify(
        formatDeliveryPayload(
          stockItems.map((item) => ({
            serialCode: item.serialCode,
            secretCode: item.secretCode,
          })),
        ),
      ),
    },
  });

  await tx.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.COMPLETED,
      completedAt: soldAt,
    },
  });
}

async function applySuccessfulPayment(
  tx: Prisma.TransactionClient,
  paymentOrder: {
    id: string;
    orderId: string;
    status: PaymentStatus;
    order: { orderNo: string };
  },
  input: {
    providerLabel: string;
    rawPayload: string;
    verified: boolean;
    providerTradeNo?: string;
    providerMerchantId?: string;
  },
) {
  const now = new Date();

  await tx.paymentOrder.update({
    where: { id: paymentOrder.id },
    data: {
      status: PaymentStatus.PAID,
      paidAt: now,
      callbackVerified: input.verified,
      rawCallbackPayload: input.rawPayload,
      providerTradeNo: input.providerTradeNo,
      providerMerchantId: input.providerMerchantId,
    },
  });

  await tx.callbackLog.create({
    data: {
      paymentOrderId: paymentOrder.id,
      provider: input.providerLabel,
      payload: input.rawPayload,
      verified: input.verified,
      processed: true,
      result: "accepted",
    },
  });

  await tx.order.update({
    where: { id: paymentOrder.orderId },
    data: {
      status: OrderStatus.PAID_PENDING_DELIVERY,
      paidAt: now,
    },
  });

  await deliverOrder(paymentOrder.orderId, tx);

  return getOrderByNo(paymentOrder.order.orderNo, tx);
}

export function serializeOrder(order: OrderWithRelations) {
  const latestPayment = order.paymentOrders[0] ?? null;
  const latestDelivery = order.deliveries[0] ?? null;

  return {
    orderNo: order.orderNo,
    accessKey: order.accessKey,
    status: order.status,
    quantity: order.quantity,
    amount: order.amount,
    currency: order.currency,
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    failureReason: order.failureReason,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    product: {
      id: order.product.id,
      name: order.product.name,
      slug: order.product.slug,
      summary: order.product.summary,
      price: order.product.price,
    },
    payment: latestPayment
      ? {
          paymentNo: latestPayment.paymentNo,
          provider: latestPayment.provider,
          paymentUrl: latestPayment.paymentUrl,
          status: latestPayment.status,
          amount: latestPayment.amount,
        }
      : null,
    delivery: latestDelivery
      ? JSON.parse(latestDelivery.payloadSnapshot)
      : null,
  };
}
