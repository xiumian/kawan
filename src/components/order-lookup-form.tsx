"use client";

import { useState } from "react";

type OrderLookupFormProps = {
  defaultOrderNo?: string;
};

type LookupResult = {
  orderNo: string;
  status: string;
  product: {
    name: string;
  };
  payment: {
    status: string;
  } | null;
  delivery:
    | {
        full: Array<{ serialCode: string; secretCode: string }>;
      }
    | null;
};

export function OrderLookupForm({ defaultOrderNo = "" }: OrderLookupFormProps) {
  const [orderNo, setOrderNo] = useState(defaultOrderNo);
  const [verification, setVerification] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderNo: String(formData.get("orderNo") ?? ""),
        verification: String(formData.get("verification") ?? ""),
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "未查到匹配订单");
      return;
    }

    setResult(data.order);
  }

  return (
    <div className="panel-surface space-y-6">
      <form action={handleSubmit} className="space-y-4">
        <label className="field-shell">
          <span className="field-label">订单号</span>
          <input
            className="field-input"
            name="orderNo"
            value={orderNo}
            onChange={(event) => setOrderNo(event.target.value)}
            placeholder="CF..."
            disabled={loading}
          />
        </label>
        <label className="field-shell">
          <span className="field-label">邮箱或手机号后四位</span>
          <input
            className="field-input"
            name="verification"
            value={verification}
            onChange={(event) => setVerification(event.target.value)}
            placeholder="user@example.com / 8000"
            disabled={loading}
          />
        </label>
        <button className="action-primary w-full justify-center" disabled={loading}>
          {loading ? "查询中..." : "查询订单"}
        </button>
      </form>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}

      {result ? (
        <div className="space-y-4 border-t border-white/10 pt-5">
          <div className="text-sm text-slate-400">
            {result.orderNo} · {result.product.name} · {result.status}
          </div>
          {result.delivery ? (
            <div className="space-y-3">
              {result.delivery.full.map((item) => (
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
          ) : (
            <div className="text-sm text-slate-400">当前订单尚未发货。</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
