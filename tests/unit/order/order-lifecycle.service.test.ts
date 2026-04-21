import { OrderStatus, PaymentStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  expireOrderIfNeeded,
  expirePendingOrders,
  shouldExpireOrder,
} from "@/modules/order/order-lifecycle.service";

describe("order-lifecycle.service", () => {
  it("detects overdue unpaid orders", () => {
    expect(
      shouldExpireOrder(
        {
          status: OrderStatus.PENDING_PAYMENT,
          expiresAt: new Date("2026-04-18T00:14:59.000Z"),
          paidAt: null,
        },
        new Date("2026-04-18T00:15:00.000Z"),
      ),
    ).toBe(true);

    expect(
      shouldExpireOrder(
        {
          status: OrderStatus.COMPLETED,
          expiresAt: new Date("2026-04-18T00:00:00.000Z"),
          paidAt: new Date("2026-04-18T00:01:00.000Z"),
        },
        new Date("2026-04-18T00:15:00.000Z"),
      ),
    ).toBe(false);
  });

  it("expires a single overdue order and its waiting payment records", async () => {
    const orderUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const paymentUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const client = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "order_1",
          status: OrderStatus.PENDING_PAYMENT,
          expiresAt: new Date("2026-04-18T00:00:00.000Z"),
          paidAt: null,
        }),
      },
      paymentOrder: {
        updateMany: paymentUpdateMany,
      },
      $transaction: async (
        callback: (tx: {
          order: { updateMany: typeof orderUpdateMany };
          paymentOrder: { updateMany: typeof paymentUpdateMany };
        }) => Promise<boolean>,
      ) =>
        callback({
          order: {
            updateMany: orderUpdateMany,
          },
          paymentOrder: {
            updateMany: paymentUpdateMany,
          },
        }),
    };

    const expired = await expireOrderIfNeeded(
      "CF20260418000000AAAA0001",
      client,
      new Date("2026-04-18T00:15:00.000Z"),
    );

    expect(expired).toBe(true);
    expect(orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.CANCELLED,
          failureReason: "订单超时未支付，已自动关闭",
        }),
      }),
    );
    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: {
        orderId: "order_1",
        status: {
          in: [PaymentStatus.CREATED, PaymentStatus.WAITING],
        },
      },
      data: {
        status: PaymentStatus.EXPIRED,
      },
    });
  });

  it("batch-expires overdue orders and reports the affected count", async () => {
    const orderUpdateMany = vi.fn().mockResolvedValue({ count: 2 });
    const paymentUpdateMany = vi.fn().mockResolvedValue({ count: 2 });
    const client = {
      order: {
        findMany: vi.fn().mockResolvedValue([{ id: "order_1" }, { id: "order_2" }]),
      },
      paymentOrder: {
        updateMany: paymentUpdateMany,
      },
      $transaction: async (
        callback: (tx: {
          order: { updateMany: typeof orderUpdateMany };
          paymentOrder: { updateMany: typeof paymentUpdateMany };
        }) => Promise<number>,
      ) =>
        callback({
          order: {
            updateMany: orderUpdateMany,
          },
          paymentOrder: {
            updateMany: paymentUpdateMany,
          },
        }),
    };

    const count = await expirePendingOrders(
      client,
      new Date("2026-04-18T00:15:00.000Z"),
    );

    expect(count).toBe(2);
    expect(orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: {
            in: ["order_1", "order_2"],
          },
        },
      }),
    );
    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: {
        orderId: {
          in: ["order_1", "order_2"],
        },
        status: {
          in: [PaymentStatus.CREATED, PaymentStatus.WAITING],
        },
      },
      data: {
        status: PaymentStatus.EXPIRED,
      },
    });
  });
});
