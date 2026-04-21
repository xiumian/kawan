"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type MockPaymentButtonProps = {
  paymentNo: string;
};

export function MockPaymentButton({ paymentNo }: MockPaymentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/payments/mock/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentNo }),
    });
    const data = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(data.error ?? "支付确认失败");
      return;
    }

    startTransition(() => {
      router.push(`/checkout/${data.order.orderNo}?key=${data.order.accessKey}`);
    });
  }

  return (
    <div className="space-y-3">
      <button className="action-primary" disabled={loading} onClick={handleConfirm} type="button">
        {loading ? "处理中..." : "确认支付成功"}
      </button>
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
    </div>
  );
}
