import {
  confirmVerifiedPaymentCallback,
  recordPaymentCallbackFailure,
} from "@/modules/order/order.repository";
import {
  getCallbackPayloadFromEntries,
  verifyPaymentCallback,
} from "@/modules/payment/payment.service";

export async function GET(request: Request) {
  return handleCallback(request);
}

export async function POST(request: Request) {
  return handleCallback(request);
}

async function handleCallback(request: Request) {
  const payload = await readCallbackPayload(request);
  const callback = verifyPaymentCallback(payload);

  if (!callback.paymentNo) {
    return new Response("fail", { status: 400 });
  }

  if (!callback.verified) {
    await recordPaymentCallbackFailure({
      paymentNo: callback.paymentNo,
      providerLabel: callback.provider,
      payload: callback.rawPayload,
      verified: false,
      result: "verify-failed",
    });
    return new Response("fail", { status: 400 });
  }

  try {
    await confirmVerifiedPaymentCallback(callback);
    return new Response("success");
  } catch (error) {
    await recordPaymentCallbackFailure({
      paymentNo: callback.paymentNo,
      providerLabel: callback.provider,
      payload: callback.rawPayload,
      verified: callback.verified,
      result: error instanceof Error ? error.message : "callback-failed",
    });
    return new Response("fail", { status: 400 });
  }
}

async function readCallbackPayload(request: Request) {
  const url = new URL(request.url);

  if (request.method === "GET") {
    return getCallbackPayloadFromEntries(url.searchParams.entries());
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json()) as Record<string, string>;
    return payload;
  }

  const formData = await request.formData();
  return getCallbackPayloadFromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  );
}
