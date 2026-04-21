import { notFound } from "next/navigation";

import { PurchaseForm } from "@/components/purchase-form";
import { getProductBySlug } from "@/modules/catalog/catalog.repository";

export const dynamic = "force-dynamic";

function buildShortDescription(description?: string, summary?: string) {
  const source = (description ?? summary ?? "").replace(/\s+/g, " ").trim();

  if (!source) {
    return "当前商品暂无补充说明";
  }

  return source.slice(0, 140) + (source.length > 140 ? "..." : "");
}

export default async function ProductDetailPage(
  props: PageProps<"/products/[slug]">,
) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const purchaseLimitMin = product.purchaseLimitMin ?? 1;
  const purchaseLimitMax = product.purchaseLimitMax ?? 5;
  const shortDescription = buildShortDescription(product.description, product.summary);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="order-panel space-y-5">
          <div className="section-label">{product.category?.name ?? "数字卡密"}</div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {product.name}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              {product.summary}
            </p>
          </div>

          <div className="order-meta">
            <div className="order-meta-item">
              <span className="order-meta-label">价格</span>
              <span className="order-meta-value">{product.priceLabel}</span>
            </div>
            <div className="order-meta-item">
              <span className="order-meta-label">库存</span>
              <span className="order-meta-value">{product.availableStock}</span>
            </div>
            <div className="order-meta-item">
              <span className="order-meta-label">限购</span>
              <span className="order-meta-value">
                {purchaseLimitMin}-{purchaseLimitMax}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="section-label">商品说明</div>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              {shortDescription}
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-8">
          <PurchaseForm
            productId={product.id}
            productName={product.name}
            priceLabel={product.priceLabel}
            minQuantity={purchaseLimitMin}
            maxQuantity={purchaseLimitMax}
            disabled={product.availableStock <= 0}
          />
        </div>
      </section>
    </div>
  );
}
