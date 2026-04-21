import { describe, expect, it } from "vitest";

import {
  formatDeliveryPayload,
  maskSecretCode,
} from "@/modules/delivery/delivery.service";

describe("delivery.service", () => {
  it("masks the tail of secret codes for previews", () => {
    expect(maskSecretCode("1234567890")).toBe("1234******");
  });

  it("formats delivered stock items into a payload snapshot", () => {
    const payload = formatDeliveryPayload([
      { serialCode: "STEAM-001", secretCode: "1234567890" },
      { serialCode: "STEAM-002", secretCode: "ABCDEFGHIJ" },
    ]);

    expect(payload.preview).toEqual([
      { serialCode: "STEAM-001", secretCodeMasked: "1234******" },
      { serialCode: "STEAM-002", secretCodeMasked: "ABCD******" },
    ]);
    expect(payload.count).toBe(2);
  });
});
