export default function SupportPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="space-y-3 border-b border-white/10 pb-8">
        <div className="section-label">Help Center</div>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
          购买说明与售后边界
        </h1>
      </div>

      <div className="grid gap-5">
        {[
          {
            title: "支付说明",
            body: "当前站点默认保留 mockpay 本地演示通道，同时已经预留 easypay-compatible 真实支付适配接口。上线时切换 provider 即可，不需要重写下单和发货主链。",
          },
          {
            title: "发货说明",
            body: "卡密商品支付成功后自动发货，订单页与查单页均可查看结果。库存不足时订单会进入异常队列，后台介入处理。",
          },
          {
            title: "退款规则",
            body: "卡密类商品一旦自动发货，默认不支持无理由退款。支付未成功、未发货或系统异常的订单可由后台人工处理。",
          },
          {
            title: "合规边界",
            body: "站点首发面向中国大陆个人主体，不假设企业直连官方支付接口，不内置高风险灰产类商品表达。",
          },
        ].map((item) => (
          <section key={item.title} className="panel-surface space-y-3">
            <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
            <p className="text-sm leading-8 text-slate-300">{item.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
