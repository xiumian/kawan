import Link from "next/link";

type ProductStripProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    summary?: string;
    priceLabel: string;
    stockLabel: string;
    category?: { name: string };
  };
};

export function ProductStrip({ product }: ProductStripProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="grid gap-4 sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:items-start">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 text-[11px] uppercase tracking-[0.24em] text-slate-500">
          封面
        </div>

        <div className="min-w-0 space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
            {product.category?.name ?? "数字卡密"}
          </div>
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-white sm:text-xl">
            {product.name}
          </h3>
          {product.summary ? (
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              {product.summary}
            </p>
          ) : null}
          <dl className="grid gap-1 text-sm text-slate-300 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">价格</dt>
              <dd className="font-medium text-white">{product.priceLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">库存</dt>
              <dd className="font-medium text-white">{product.stockLabel}</dd>
            </div>
          </dl>
        </div>

        <div className="sm:pt-1">
          <Link
            className="inline-flex items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:border-cyan-300/50 hover:bg-cyan-300/15"
            href={`/products/${product.slug}`}
          >
            查看详情
          </Link>
        </div>
      </div>
    </div>
  );
}
