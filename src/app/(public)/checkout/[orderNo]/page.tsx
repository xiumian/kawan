import { redirect } from "next/navigation";

import { CheckoutStatus } from "@/components/checkout-status";
import { buildCheckoutQrDataUrl } from "@/modules/payment/payment.qr";
import {
  getOrderByNo,
  serializeOrder,
} from "@/modules/order/order.repository";

export const dynamic = "force-dynamic";

export default async function CheckoutPage(props: PageProps<"/checkout/[orderNo]">) {
  const { orderNo } = await props.params;
  const searchParams = await props.searchParams;
  const accessKey =
    typeof searchParams.key === "string" ? searchParams.key : "";
  const order = await getOrderByNo(orderNo);

  if (!order || order.accessKey !== accessKey) {
    redirect(`/orders/lookup?orderNo=${orderNo}`);
  }

  const paymentUrl = order.paymentOrders[0]?.paymentUrl ?? null;
  const qrCodeDataUrl = paymentUrl
    ? await buildCheckoutQrDataUrl(paymentUrl)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="space-y-3 border-b border-white/10 pb-8">
        <div className="section-label">Checkout Session</div>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
          {order.orderNo}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-400">
          这是本次订单的实时结算页。二维码与支付会话一一对应，支付成功后会自动刷新发货结果。
        </p>
      </div>

      <CheckoutStatus
        initialOrder={serializeOrder(order)}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    </div>
  );
}
