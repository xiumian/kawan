import Link from "next/link";
import { notFound } from "next/navigation";

import { MockPaymentButton } from "@/components/mock-payment-button";
import { prisma } from "@/lib/prisma";
import { formatPriceCny } from "@/modules/site/brand-config";

export const dynamic = "force-dynamic";

export default async function MockPaymentPage(
  props: PageProps<"/pay/mock/[paymentNo]">,
) {
  const { paymentNo } = await props.params;

  const payment = await prisma.paymentOrder.findUnique({
    where: { paymentNo },
    include: {
      order: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="space-y-3 border-b border-white/10 pb-8">
        <div className="section-label">Mock Payment Provider</div>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
          扫码支付确认页
        </h1>
        <p className="text-sm leading-7 text-slate-400">
          这是一期演示默认接入的可替换支付适配层。它真实模拟了二维码支付完成后的回调与自动发货闭环。
        </p>
      </div>

      <div className="panel-surface space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
              Payment No
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{payment.paymentNo}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
              金额
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPriceCny(payment.amount)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">{payment.order.product.name}</h2>
          <p className="text-sm leading-7 text-slate-400">
            订单号：{payment.order.orderNo} · 数量：{payment.order.quantity}
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <MockPaymentButton paymentNo={payment.paymentNo} />
          <Link
            className="action-secondary"
            href={`/checkout/${payment.order.orderNo}?key=${payment.order.accessKey}`}
          >
            返回结算页
          </Link>
        </div>
      </div>
    </div>
  );
}
