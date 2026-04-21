"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type StockImportFormProps = {
  products: Array<{ id: string; name: string }>;
};

export function StockImportForm({ products }: StockImportFormProps) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [batchLabel, setBatchLabel] = useState("BATCH-20260418");
  const [content, setContent] = useState(
    "STEAM-NEW-01,CFP9001X1\nSTEAM-NEW-02,CFP9002X2",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/stock/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: String(formData.get("productId") ?? ""),
        batchLabel: String(formData.get("batchLabel") ?? ""),
        content: String(formData.get("content") ?? ""),
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "导入失败");
      return;
    }

    setMessage(`已导入 ${data.importedCount} 条库存`);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="panel-surface space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">快速补库存</h2>
        <p className="text-sm leading-7 text-slate-400">
          每行一条，支持 `序列号,卡密` 或仅填 `卡密` 自动生成序列号。
        </p>
      </div>

      <label className="field-shell">
        <span className="field-label">商品</span>
        <select
          className="field-input"
          name="productId"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-shell">
        <span className="field-label">批次号</span>
        <input
          className="field-input"
          name="batchLabel"
          value={batchLabel}
          onChange={(event) => setBatchLabel(event.target.value)}
        />
      </label>

      <label className="field-shell">
        <span className="field-label">库存内容</span>
        <textarea
          className="field-input min-h-40 resize-y"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>

      {message ? <div className="text-sm text-emerald-300">{message}</div> : null}
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}

      <button className="action-primary w-full justify-center" disabled={loading}>
        {loading ? "导入中..." : "导入库存"}
      </button>
    </form>
  );
}
