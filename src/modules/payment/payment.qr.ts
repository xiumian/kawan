import QRCode from "qrcode";

export async function buildCheckoutQrDataUrl(paymentUrl: string) {
  return QRCode.toDataURL(paymentUrl, {
    margin: 1,
    width: 320,
    color: {
      dark: "#d9fbff",
      light: "#071217",
    },
  });
}
