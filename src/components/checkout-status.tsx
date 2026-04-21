"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type SerializedOrder = {
  orderNo: string;
  accessKey: string;
  status: string;
  quantity: number;
  amount: number;
  expiresAt: string;
  failureReason: string | null;
  product: {
    name: string;
    price: number;
  };
  payment: {
    paymentNo: string;
    paymentUrl: string;
    amount: number;
    status: string;
  } | null;
  delivery:
    | {
        count: number;
        full: Array<{ serialCode: string; secretCode: string }>;
        preview: Array<{ serialCode: string; secretCodeMasked: string }>;
      }
    | null;
};

type CheckoutStatusProps = {
  initialOrder: SerializedOrder;
  qrCodeDataUrl: string | null;
};

const FINAL_STATES = new Set(["COMPLETED", "EXCEPTION", "CANCELLED"]);

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "待支付",
  PAYMENT_PROCESSING: "支付处理中",
  PAID_PENDING_DELIVERY: "已支付，待发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  EXCEPTION: "异常待处理",
};

export function CheckoutStatus({
  initialOrder,
  qrCodeDataUrl,
}: CheckoutStatusProps) {
  const [order, setOrder] = useState(initialOrder);
  const [pollError, setPollError] = useState("");
  const expiresIn = useCountdown(order.expiresAt);

  useEffect(() => {
    if (FINAL_STATES.has(order.status)) {
      return;
    }

    const timer = window.setInterval(async () => {
      const response = await fetch(
        `/api/orders/${order.orderNo}?key=${order.accessKey}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setPollError(data.error ?? "订单状态同步失败");
        return;
      }

      setOrder(data.order);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [order.accessKey, order.orderNo, order.status]);

  const amountLabel = useMemo(() => `¥${(order.amount / 100).toFixed(2)}`, [order.amount]);

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="panel-surface space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
              当前状态
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {statusLabels[order.status] ?? order.status}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
              剩余支付时间
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {expiresIn}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-y border-white/10 py-4 text-sm text-slate-300">
          <div className="flex items-center justify-between">
            <span>商品</span>
            <span>{order.product.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>数量</span>
            <span>{order.quantity}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>金额</span>
            <span>{amountLabel}</span>
          </div>
        </div>

        {pollError ? <p className="text-sm text-rose-300">{pollError}</p> : null}

        {order.status === "COMPLETED" && order.delivery ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">发货结果</h2>
            <div className="space-y-3">
              {order.delivery.full.map((item) => (
                <div
                  key={item.serialCode}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="font-mono text-xs uppercase tracking-[0.26em] text-cyan-200/70">
                    {item.serialCode}
                  </div>
                  <div className="mt-2 break-all text-base text-white">
                    {item.secretCode}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : order.status === "EXCEPTION" ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm leading-7 text-rose-100">
            {order.failureReason ?? "订单进入异常状态，请前往后台处理。"}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-slate-400">
              当前订单已生成支付会话。扫码或打开支付页完成付款后，结算页会自动同步支付与发货状态。
            </p>
            {order.payment ? (
              <a className="action-secondary" href={order.payment.paymentUrl}>
                打开支付页
              </a>
            ) : null}
          </div>
        )}
      </div>

      <div className="panel-surface flex min-h-[420px] flex-col items-center justify-center gap-6">
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
            Dynamic QR Session
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">订单专属二维码</h2>
        </div>
        {qrCodeDataUrl ? (
          <Image
            alt="payment qr"
            className="h-72 w-72 rounded-[2rem] border border-white/10 bg-[#071217] p-4"
            src={qrCodeDataUrl}
            unoptimized
            width={288}
            height={288}
          />
        ) : (
          <div className="text-sm text-slate-500">当前订单暂无可用二维码。</div>
        )}
      </div>
    </div>
  );
}

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState(() => getRemainingMs(expiresAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemainingMs(expiresAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const totalSeconds = Math.max(Math.floor(remaining / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function getRemainingMs(expiresAt: string) {
  return new Date(expiresAt).getTime() - Date.now();
}
