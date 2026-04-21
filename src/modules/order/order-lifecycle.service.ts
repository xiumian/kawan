import { OrderStatus, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const EXPIRABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_PROCESSING,
];

const EXPIRABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.CREATED,
  PaymentStatus.WAITING,
];

const EXPIRED_ORDER_REASON = "订单超时未支付，已自动关闭";

type LifecycleOrderSnapshot = {
  expiresAt: Date;
  paidAt: Date | null;
  status: OrderStatus;
};

type LifecycleWriteClient = {
  order: {
    updateMany(args: Record<string, unknown>): Promise<{ count: number }>;
  };
  paymentOrder: {
    updateMany(args: Record<string, unknown>): Promise<{ count: number }>;
  };
};

type LifecycleClient = LifecycleWriteClient & {
  order: LifecycleWriteClient["order"] & {
    findUnique(args: Record<string, unknown>): Promise<{
      id: string;
      expiresAt: Date;
      paidAt: Date | null;
      status: OrderStatus;
    } | null>;
    findMany(args: Record<string, unknown>): Promise<Array<{ id: string }>>;
  };
  $transaction?: <T>(
    callback: (tx: LifecycleWriteClient) => Promise<T>,
  ) => Promise<T>;
};

export function shouldExpireOrder(
  order: LifecycleOrderSnapshot,
  now = new Date(),
) {
  return (
    EXPIRABLE_ORDER_STATUSES.includes(order.status) &&
    !order.paidAt &&
    order.expiresAt.getTime() <= now.getTime()
  );
}

export async function expireOrderIfNeeded(
  orderNo: string,
  client: LifecycleClient = prisma as unknown as LifecycleClient,
  now = new Date(),
) {
  const order = await client.order.findUnique({
    where: { orderNo },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      paidAt: true,
    },
  });

  if (!order || !shouldExpireOrder(order, now)) {
    return false;
  }

  return withLifecycleTransaction(client, async (tx) => {
    const result = await tx.order.updateMany({
      where: {
        id: order.id,
        status: {
          in: EXPIRABLE_ORDER_STATUSES,
        },
        paidAt: null,
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: now,
        failureReason: EXPIRED_ORDER_REASON,
      },
    });

    if (result.count === 0) {
      return false;
    }

    await tx.paymentOrder.updateMany({
      where: {
        orderId: order.id,
        status: {
          in: EXPIRABLE_PAYMENT_STATUSES,
        },
      },
      data: {
        status: PaymentStatus.EXPIRED,
      },
    });

    return true;
  });
}

export async function expirePendingOrders(
  client: LifecycleClient = prisma as unknown as LifecycleClient,
  now = new Date(),
) {
  const expiredOrders = await client.order.findMany({
    where: {
      status: {
        in: EXPIRABLE_ORDER_STATUSES,
      },
      paidAt: null,
      expiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
    },
  });

  if (expiredOrders.length === 0) {
    return 0;
  }

  const orderIds = expiredOrders.map((item) => item.id);

  return withLifecycleTransaction(client, async (tx) => {
    const result = await tx.order.updateMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: now,
        failureReason: EXPIRED_ORDER_REASON,
      },
    });

    await tx.paymentOrder.updateMany({
      where: {
        orderId: {
          in: orderIds,
        },
        status: {
          in: EXPIRABLE_PAYMENT_STATUSES,
        },
      },
      data: {
        status: PaymentStatus.EXPIRED,
      },
    });

    return result.count;
  });
}

async function withLifecycleTransaction<T>(
  client: LifecycleClient,
  callback: (tx: LifecycleWriteClient) => Promise<T>,
) {
  if (typeof client.$transaction === "function") {
    return client.$transaction(callback);
  }

  return callback(client);
}
