export function maskSecretCode(secretCode: string) {
  return `${secretCode.slice(0, 4)}******`;
}

export function formatDeliveryPayload(
  items: Array<{ serialCode: string; secretCode: string }>,
) {
  return {
    count: items.length,
    deliveredAt: new Date().toISOString(),
    preview: items.map((item) => ({
      serialCode: item.serialCode,
      secretCodeMasked: maskSecretCode(item.secretCode),
    })),
    full: items,
  };
}
