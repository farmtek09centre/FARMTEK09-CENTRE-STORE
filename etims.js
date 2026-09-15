/**
 * KRA eTIMS OSCU client.
 *
 * Built directly against the official spec:
 *   https://www.kra.go.ke/images/publications/OSCU_Specification_Document_v2.0.pdf
 * (OSCU = Online Sales Control Unit — the right choice for an
 * always-on web checkout, as opposed to VSCU for offline-capable POS.)
 *
 * Flow implemented here:
 *   1. initDevice()  -> POST /selectInitOsdcInfo   (once your device is
 *      approved by KRA, this exchanges tin+bhfId+dvcSrlNo for a
 *      "cmcKey" that every other call must include.)
 *   2. submitInvoice() -> POST /saveTrnsSalesOsdc  (registers one sale
 *      and returns the KRA-issued receipt number/signature.)
 *
 * BEFORE THIS CAN TALK TO REAL KRA SERVERS YOU MUST:
 *   - Register FARMTEK09 CENTRE for eTIMS on iTax / the eTIMS portal
 *     and get KRA to approve an OSCU device application. Only KRA can
 *     issue you a TIN, branch ID (bhfId) and approve your chosen
 *     device serial number (dvcSrlNo) — nothing here can do that step.
 *   - Put those values in server/.env (copy from .env.example) and
 *     set ETIMS_ENABLED=true.
 * Until then, isEnabled() returns false and server.js issues ordinary
 * (non-KRA-registered) receipts instead of calling this module.
 */

const BASE_URLS = {
  sandbox: "https://etims-api-sbx.kra.go.ke/etims-api",
  production: "https://etims-api.kra.go.ke/etims-api",
};

// Section 4.1 of the spec: A=Exempt, B=16%, C=0% (zero-rated),
// D=Non-VAT, E=8%. Confirm with KRA/your accountant which applies to
// each product — see the taxTypeCd field in products.js.
const TAX_RATES = { A: 0, B: 0.16, C: 0, D: 0, E: 0.08 };

// Section 4.11 Payment Method codes.
const PAYMENT_TYPE_CODES = { mpesa: "06", cash: "01", bank: "07" };

let cachedCmcKey = null;

function config() {
  return {
    enabled: process.env.ETIMS_ENABLED === "true",
    env: process.env.ETIMS_ENV === "production" ? "production" : "sandbox",
    tin: process.env.ETIMS_TIN || "",
    bhfId: process.env.ETIMS_BHF_ID || "00",
    dvcSrlNo: process.env.ETIMS_DVC_SRL_NO || "",
  };
}

function isEnabled() {
  const c = config();
  return c.enabled && !!c.tin && !!c.dvcSrlNo;
}

function baseUrl() {
  return BASE_URLS[config().env];
}

async function callEtims(path, body) {
  const res = await fetch(baseUrl() + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.resultCd !== "000") {
    const err = new Error(`eTIMS ${path} failed: ${data.resultCd} ${data.resultMsg || ""}`);
    err.resultCd = data.resultCd;
    throw err;
  }
  return data;
}

async function initDevice() {
  const c = config();
  const data = await callEtims("/selectInitOsdcInfo", {
    tin: c.tin,
    bhfId: c.bhfId,
    dvcSrlNo: c.dvcSrlNo,
  });
  cachedCmcKey = data.data.info.cmcKey;
  return cachedCmcKey;
}

async function getCmcKey() {
  if (cachedCmcKey) return cachedCmcKey;
  return initDevice();
}

// ---- Tax + item-code helpers -----------------------------------------

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * `prc` in the KRA schema is the tax-INCLUSIVE unit price (what the
 * customer actually pays). This backs out the taxable base and VAT
 * portion from that gross amount. For taxTypeCd D (Non-VAT, the
 * products.js default) the rate is 0, so splyAmt = taxblAmt and
 * taxAmt = 0 — the common case needs no VAT math at all.
 */
function computeLineAmounts(unitPrice, qty, taxTypeCd) {
  const rate = TAX_RATES[taxTypeCd] ?? 0;
  const splyAmt = round2(unitPrice * qty);
  const taxblAmt = rate > 0 ? round2(splyAmt / (1 + rate)) : splyAmt;
  const taxAmt = round2(splyAmt - taxblAmt);
  return { splyAmt, taxblAmt, taxAmt };
}

/**
 * Builds a taxpayer-owned item code in the KE<type><pkgUnit><qtyUnit>
 * <7-digit seq> shape described in section 4.19 of the spec.
 * "2" = Finished Product (section 4.3). Packaging/quantity unit
 * defaults (PU=Traypack, U=Pieces) are a reasonable guess for potted
 * seedlings — change per-product in products.js if yours differ.
 */
function buildItemCode(index, pkgUnitCd, qtyUnitCd) {
  const seq = String(index + 1).padStart(7, "0");
  return `KE2${pkgUnitCd}${qtyUnitCd}${seq}`;
}

function timestamp14(date) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    p(date.getMonth() + 1) +
    p(date.getDate()) +
    p(date.getHours()) +
    p(date.getMinutes()) +
    p(date.getSeconds())
  );
}

function date8(date) {
  return timestamp14(date).slice(0, 8);
}

// ---- Sales submission ---------------------------------------------------

/**
 * order = {
 *   invoiceSeq: number,           // your own ascending sequence
 *   items: [{ product, index, qty }],  // product = entry from products.js
 *   customer: { name, phone, pin },
 *   paymentMethod: "mpesa" | "cash" | "bank",
 * }
 * Returns { kraInvoiceNo, scuId, signature, raw } on success, or throws.
 */
async function submitInvoice(order, attempt = 1) {
  const c = config();
  const cmcKey = await getCmcKey();
  const now = new Date();

  const buckets = { A: { taxbl: 0, tax: 0 }, B: { taxbl: 0, tax: 0 }, C: { taxbl: 0, tax: 0 }, D: { taxbl: 0, tax: 0 }, E: { taxbl: 0, tax: 0 } };

  const itemList = order.items.map(({ product, index, qty }) => {
    const pkgUnitCd = product.pkgUnitCd || "PU";
    const qtyUnitCd = product.qtyUnitCd || "U";
    const taxTypeCd = product.taxTypeCd || "D";
    const { splyAmt, taxblAmt, taxAmt } = computeLineAmounts(product.price, qty, taxTypeCd);

    buckets[taxTypeCd].taxbl = round2(buckets[taxTypeCd].taxbl + taxblAmt);
    buckets[taxTypeCd].tax = round2(buckets[taxTypeCd].tax + taxAmt);

    return {
      itemSeq: index + 1,
      itemClsCd: product.itemClsCd || "5059690800", // PLACEHOLDER — fetch your real code via /selectItemClsList
      itemCd: buildItemCode(index, pkgUnitCd, qtyUnitCd),
      itemNm: product.name,
      bcd: null,
      pkgUnitCd,
      pkg: qty,
      qtyUnitCd,
      qty,
      prc: product.price,
      splyAmt,
      dcRt: 0,
      dcAmt: 0,
      taxTyCd: taxTypeCd,
      taxblAmt,
      taxAmt,
      totAmt: splyAmt,
    };
  });

  const totItemCnt = itemList.length;
  const totTaxblAmt = round2(Object.values(buckets).reduce((s, b) => s + b.taxbl, 0));
  const totTaxAmt = round2(Object.values(buckets).reduce((s, b) => s + b.tax, 0));
  const totAmt = round2(itemList.reduce((s, i) => s + i.totAmt, 0));

  const trdInvcNo = `FARMTEK-${String(order.invoiceSeq).padStart(6, "0")}`;
  const cfmDt = timestamp14(now);

  const payload = {
    tin: c.tin,
    bhfId: c.bhfId,
    cmcKey,
    trdInvcNo,
    invcNo: order.invoiceSeq,
    orgInvcNo: 0,
    custTin: order.customer.pin || null,
    custNm: order.customer.name,
    salesTyCd: "N", // Normal (section 4.9 Transaction Type)
    rcptTyCd: "S", // Sale (section 4.10 Sales Receipt Type)
    pmtTyCd: PAYMENT_TYPE_CODES[order.paymentMethod] || "07",
    salesSttsCd: "02", // Approved (section 4.12 Transaction Progress)
    cfmDt,
    salesDt: date8(now),
    stockRlsDt: cfmDt,
    cnclReqDt: null,
    cnclDt: null,
    rfdDt: null,
    rfdRsnCd: null,
    totItemCnt,
    taxblAmtA: buckets.A.taxbl,
    taxblAmtB: buckets.B.taxbl,
    taxblAmtC: buckets.C.taxbl,
    taxblAmtD: buckets.D.taxbl,
    taxblAmtE: buckets.E.taxbl,
    taxRtA: TAX_RATES.A * 100,
    taxRtB: TAX_RATES.B * 100,
    taxRtC: TAX_RATES.C * 100,
    taxRtD: TAX_RATES.D * 100,
    taxRtE: TAX_RATES.E * 100,
    taxAmtA: buckets.A.tax,
    taxAmtB: buckets.B.tax,
    taxAmtC: buckets.C.tax,
    taxAmtD: buckets.D.tax,
    taxAmtE: buckets.E.tax,
    totTaxblAmt,
    totTaxAmt,
    totAmt,
    prchrAcptcYn: "N",
    remark: order.notes || null,
    regrId: "WEBSITE",
    regrNm: "Farmtek09 Online Store",
    modrId: "WEBSITE",
    modrNm: "Farmtek09 Online Store",
    receipt: {
      custTin: order.customer.pin || null,
      custMblNo: order.customer.phone || null,
      rcptPbctDt: cfmDt,
      trdeNm: "FARMTEK09 CENTRE",
      adrs: process.env.BUSINESS_ADDRESS || "Lower Kabete, Nairobi",
      topMsg: null,
      btmMsg: "Thank you for shopping with Farmtek09Centre",
      prchrAcptcYn: "N",
    },
    itemList,
  };

  try {
    const data = await callEtims("/saveTrnsSalesOsdc", payload);
    return {
      kraInvoiceNo: order.invoiceSeq,
      curRcptNo: data.data.curRcptNo,
      scuId: c.dvcSrlNo,
      signature: data.data.rcptSign,
      sdcDateTime: data.data.sdcDateTime,
      raw: data,
    };
  } catch (err) {
    // Device-related error codes (section 4.18) — re-init once and retry.
    const deviceErrorCodes = ["900", "901", "902", "903"];
    if (attempt === 1 && deviceErrorCodes.includes(err.resultCd)) {
      cachedCmcKey = null;
      await initDevice();
      return submitInvoice(order, 2);
    }
    throw err;
  }
}

// ---- Optional lookup helpers (not called during checkout) --------------
// Run these yourself once you have sandbox access, to confirm the real
// codes for `itemClsCd` etc. rather than trusting the placeholder above.

async function getCodeList(lastReqDt = "20200101000000") {
  const cmcKey = await getCmcKey();
  const c = config();
  return callEtims("/selectCodeList", { tin: c.tin, bhfId: c.bhfId, cmcKey, lastReqDt });
}

async function getItemClassificationList(lastReqDt = "20200101000000") {
  const cmcKey = await getCmcKey();
  const c = config();
  return callEtims("/selectItemClsList", { tin: c.tin, bhfId: c.bhfId, cmcKey, lastReqDt });
}

module.exports = { isEnabled, initDevice, submitInvoice, getCodeList, getItemClassificationList };
