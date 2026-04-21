export const brandConfig = {
  name: "chenfenpro",
  nav: [
    { href: "/orders/lookup", label: "查单" },
    { href: "/admin", label: "后台" },
  ],
} as const;

export function formatPriceCny(amountInFen: number) {
  return `¥${(amountInFen / 100).toFixed(2)}`;
}
