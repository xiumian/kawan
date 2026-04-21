import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, fetchMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

import { PurchaseForm } from "@/components/purchase-form";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  pushMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("PurchaseForm", () => {
  it("shows the new default CTA and drops the old QR wording", () => {
    render(
      <PurchaseForm
        productId="product-1"
        productName="Steam 100"
        priceLabel="¥19.90"
        minQuantity={1}
        maxQuantity={5}
      />,
    );

    expect(screen.getByRole("button", { name: "立即购买" })).toBeTruthy();
    expect(screen.queryByText("生成专属二维码")).toBeNull();
  });

  it("shows stock shortage state when disabled", () => {
    render(
      <PurchaseForm
        productId="product-1"
        productName="Steam 100"
        priceLabel="¥19.90"
        minQuantity={1}
        maxQuantity={5}
        disabled
      />,
    );

    const button = screen.getByRole("button", { name: "库存不足" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("submits the order and navigates on success", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({
        order: {
          orderNo: "ORDER-123",
          accessKey: "ACCESS-456",
        },
      }),
    });

    render(
      <PurchaseForm
        productId="product-1"
        productName="Steam 100"
        priceLabel="¥19.90"
        minQuantity={1}
        maxQuantity={5}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "立即购买" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toEqual({
      productId: "product-1",
      quantity: 1,
      customerEmail: "",
      customerPhone: "",
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/checkout/ORDER-123?key=ACCESS-456");
    });
  });

  it("restores the form when the API returns an error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValueOnce({
        error: "库存不足，暂时无法创建订单",
      }),
    });

    render(
      <PurchaseForm
        productId="product-1"
        productName="Steam 100"
        priceLabel="¥19.90"
        minQuantity={1}
        maxQuantity={5}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "立即购买" }));

    await waitFor(() =>
      expect(screen.getByText("库存不足，暂时无法创建订单")).toBeTruthy(),
    );

    const button = screen.getByRole("button", { name: "立即购买" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("restores the form when response parsing throws", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockRejectedValueOnce(new Error("坏的响应体")),
    });

    render(
      <PurchaseForm
        productId="product-1"
        productName="Steam 100"
        priceLabel="¥19.90"
        minQuantity={1}
        maxQuantity={5}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "立即购买" }));

    await waitFor(() => expect(screen.getByText("坏的响应体")).toBeTruthy());

    const button = screen.getByRole("button", { name: "立即购买" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
