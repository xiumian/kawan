import { OrderLookupForm } from "@/components/order-lookup-form";

export const dynamic = "force-dynamic";

export default async function OrderLookupPage(
  props: PageProps<"/orders/lookup">,
) {
  const searchParams = await props.searchParams;
  const defaultOrderNo =
    typeof searchParams.orderNo === "string" ? searchParams.orderNo : "";

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-20 pt-10 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
      <section className="space-y-5">
        <div className="section-label">Order Retrieval</div>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
          查订单，不碰后台。
        </h1>
        <p className="max-w-md text-sm leading-8 text-slate-400">
          输入订单号和下单邮箱，或者订单号和手机号后四位，即可查看支付状态和已发卡密。
        </p>
      </section>

      <OrderLookupForm defaultOrderNo={defaultOrderNo} />
    </div>
  );
}
