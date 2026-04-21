# Storefront Smoke Checklist

Use this checklist for final storefront verification after the homepage refactor.
Run it against the local build and record the exact route, action, and visible result for every failed step.

## Checklist

- [ ] Open `/` and confirm the home page lands directly on the product list, not a narrative landing page.
- [ ] On `/`, confirm the header only shows `chenfenpro`, `查单`, and `后台`.
- [ ] On `/`, click a product card and confirm navigation goes to `/products/[slug]` for that item.
- [ ] On `/products/[slug]`, submit the order form and confirm the success result is a redirect to `/checkout/[orderNo]?key=...`.
- [ ] On `/checkout/[orderNo]?key=...`, confirm the page displays a payment QR or the mockpay payment entry point.
- [ ] Open `/orders/lookup` and confirm the route is reachable from the header and directly in the browser.
- [ ] On `/orders/lookup`, confirm lookup requires `orderNo` plus either email or the last 4 digits of the phone number, not only the order number.
- [ ] After payment confirmation, repeat lookup and confirm the result shows the delivered card key.

## Notes

- If a step fails, write down the exact URL, the user action taken, and the text or UI state that proved the failure.
- If the failure is a redirect or missing field, include the expected route or required input in the note.
