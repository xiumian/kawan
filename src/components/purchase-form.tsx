"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type PurchaseFormProps = {
  productId: string;
  productName: string;
  priceLabel: string;
  minQuantity: number;
  maxQuantity: number;
  disabled?: boolean;
};

export function PurchaseForm({
  productId,
  productName,
  priceLabel,
  minQuantity,
  maxQuantity,
  disabled = false,
}: PurchaseFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(minQuantity);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: Number(formData.get("quantity")),
          customerEmail: String(formData.get("customerEmail") ?? ""),
          customerPhone: String(formData.get("customerPhone") ?? ""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitting(false);
        setError(data.error ?? "创建订单失败");
        return;
      }

      startTransition(() => {
        router.push(`/checkout/${data.order.orderNo}?key=${data.order.accessKey}`);
      });
    } catch (error) {
      setSubmitting(false);
      setError(error instanceof Error ? error.message : "创建订单失败");
    }
  }

  return (
    <form
      className="order-panel space-y-4"
      action={handleSubmit}
      onSubmit={() => setSubmitting(true)}
    >
      <div className="space-y-1.5">
        <p className="section-label">下单信息</p>
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
          {productName}
        </h2>
        <p className="text-sm leading-7 text-slate-400">
          {priceLabel} / 单件，提交后进入支付流程。
        </p>
      </div>

      <div className="grid gap-3">
        <label className="field-shell">
          <span className="field-label">购买数量</span>
          <input
            className="field-input"
            name="quantity"
            type="number"
            min={minQuantity}
            max={maxQuantity}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            disabled={disabled || submitting}
          />
        </label>

        <label className="field-shell">
          <span className="field-label">邮箱</span>
          <input
            className="field-input"
            name="customerEmail"
            type="email"
            placeholder="可用于查单"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            disabled={submitting}
          />
        </label>

        <label className="field-shell">
          <span className="field-label">手机号</span>
          <input
            className="field-input"
            name="customerPhone"
            type="tel"
            placeholder="或填写手机号"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            disabled={submitting}
          />
        </label>
      </div>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}

      <button
        className="action-primary w-full justify-center"
        disabled={disabled || submitting}
      >
        {disabled ? "库存不足" : submitting ? "创建订单中..." : "立即购买"}
      </button>
    </form>
  );
}
