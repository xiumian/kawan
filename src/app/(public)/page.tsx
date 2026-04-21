import { ProductStrip } from "@/components/product-strip";
import { getStorefrontProducts } from "@/modules/catalog/catalog.repository";
import { buildStorefrontProducts } from "@/modules/catalog/catalog.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = buildStorefrontProducts(await getStorefrontProducts());

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-8 sm:px-8 lg:px-12">
      <section className="space-y-3 border-b border-white/10 pb-6">
        <div className="eyebrow">商品列表</div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          商品列表
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-400">
          选择商品后进入详情页下单，支付成功自动发货。
        </p>
      </section>

      <section className="space-y-4">
        {products.map((product) => (
          <ProductStrip key={product.id} product={product} />
        ))}
        {products.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
            当前没有可售商品。
          </div>
        ) : null}
      </section>
    </div>
  );
}
