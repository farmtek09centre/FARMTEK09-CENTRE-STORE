# FARMTEK09 CENTRE — checkout + eTIMS server

This is the backend for the cart/checkout added to the storefront. It:
- takes an order from `checkout.html`,
- prices it using **server-side** data (never trusts prices from the browser),
- issues a receipt, and
- optionally registers the sale with **KRA eTIMS** so the receipt is a real tax invoice.

GitHub Pages (where the rest of the site lives) can only serve static
files, so this piece needs to run somewhere that can run Node — e.g.
Render, Railway, Fly.io, or any small VPS.

## Quick start (local testing)

```bash
cd server
npm install
cp .env.example .env
npm start
```

Server runs on `http://localhost:5000`. Open `checkout.html` in a
browser (or via a local static server) — `API_BASE` at the top of its
`<script>` already points at `localhost:5000`.

With `.env` untouched (`ETIMS_ENABLED=false`), checkout works fully
and issues receipts — they're just clearly marked as not yet
KRA-registered, since eTIMS isn't configured.

## Getting real eTIMS working

"eTIMS" is KRA's Electronic Tax Invoice Management System. This code
talks to it using **OSCU** (Online Sales Control Unit) — the flavour
built for an always-online system like a web checkout, per KRA's own
[OSCU specification](https://www.kra.go.ke/images/publications/OSCU_Specification_Document_v2.0.pdf).

Nothing in this codebase can register your business with KRA — that
part is entirely on KRA's side. Steps:

1. **Register for eTIMS.** Do this on iTax / the eTIMS portal using
   FARMTEK09 CENTRE's KRA PIN. This is what gets you a `tin` and a
   branch ID (`bhfId`, usually `"00"` for a single-branch business).
2. **Apply for OSCU.** You choose a device serial number (`dvcSrlNo`)
   — it can be any identifier, e.g. `FARMTEK09WEB01`. KRA reviews and
   approves the application before the device can be used.
3. **Test in the sandbox first.** Sandbox base URL is
   `https://etims-api-sbx.kra.go.ke/etims-api` — set
   `ETIMS_ENV=sandbox` while you verify everything works, then switch
   to `ETIMS_ENV=production` (`https://etims-api.kra.go.ke/etims-api`)
   only once real sales should be registered.
4. **Fill in `server/.env`**: `ETIMS_TIN`, `ETIMS_BHF_ID`,
   `ETIMS_DVC_SRL_NO`, then set `ETIMS_ENABLED=true`.

Once that's done, `POST /api/checkout` will call KRA on every sale and
attach the KRA invoice number + digital signature to the receipt.

### Tax type codes — please confirm these

`products.js` sets every product's `taxTypeCd` to `"D"` (Non-VAT) as a
placeholder. KRA's actual codes (section 4.1 of the OSCU spec):

| Code | Meaning |
|------|---------|
| A | Exempt |
| B | 16% (standard VAT) |
| C | 0% (zero-rated) |
| D | Non-VAT |
| E | 8% |

Whether fruit tree/seedling sales should be `A`, `C`, or `D` for
FARMTEK09 CENTRE depends on your VAT registration status and how KRA
classifies live plants — **please confirm with KRA or an accountant**
rather than relying on the placeholder. This isn't tax advice, just a
default so the code runs.

### Item classification codes — also placeholders

Every item sent to KRA needs an `itemClsCd` (KRA's own product
classification code — a different thing from your own SKU). The
placeholder in `services/etims.js` (`5059690800`) is almost certainly
wrong for seedlings. Two helper functions are included for when you
have sandbox access — `getCodeList()` and `getItemClassificationList()`
in `services/etims.js` — call them once (e.g. from a scratch script)
to pull KRA's real classification list and find the right code(s) per
product, then set `itemClsCd` on each product in both `products.js`
files.

## What's implemented vs. not

Implemented: device initialisation (`/selectInitOsdcInfo`) and sales
submission (`/saveTrnsSalesOsdc`) — everything needed to register a
completed sale and get a receipt back.

Not implemented (out of scope for "add checkout + receipts", but
worth knowing about if you grow into full eTIMS compliance):
credit notes / refunds, purchase and stock endpoints, and formally
registering each item with KRA via `/saveItem` before selling it
(KRA's guidance recommends this; this integration sends item details
inline with each sale instead, which the spec's sales payload also
supports).

## Connecting to M-Pesa

This checkout doesn't include the M-Pesa STK push server — that's a
separate piece. The natural place to connect them: once Daraja
confirms payment in your M-Pesa callback handler, call the same order
logic that `/api/checkout` runs here (resolve items → total → receipt
→ eTIMS), rather than issuing the receipt at "Confirm Order" time
before payment is actually verified.

## Data & pricing

- `products.js` here must be kept in sync with `/products.js` at the
  site root. Only this server copy is used for pricing.
- Invoice numbers are tracked in `data/counter.json`, a plain file.
  Fine for normal order volumes; move to a real database if you ever
  need concurrent-safe counting at higher volume.
