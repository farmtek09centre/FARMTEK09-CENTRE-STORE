require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const PRODUCTS = require("./products");
const etims = require("./services/etims");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

// ---- Simple file-backed invoice counter --------------------------------
// Fine for a small nursery's order volume. If orders start arriving
// concurrently at real volume, swap this for an atomic counter in a
// real database (SQLite/Postgres) instead.
const COUNTER_FILE = path.join(__dirname, "data", "counter.json");

function nextInvoiceSeq() {
  let seq = 0;
  try {
    seq = JSON.parse(fs.readFileSync(COUNTER_FILE, "utf8")).seq || 0;
  } catch (e) {
    // No counter file yet — starting fresh.
  }
  seq += 1;
  fs.mkdirSync(path.dirname(COUNTER_FILE), { recursive: true });
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ seq }));
  return seq;
}

// ---- Routes --------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ ok: true, etimsEnabled: etims.isEnabled() });
});

app.post("/api/checkout", async (req, res) => {
  try {
    const body = req.body || {};
    const customer = body.customer || {};
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!customer.name || !customer.phone) {
      return res.status(400).json({ error: "Customer name and phone are required." });
    }
    if (rawItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    // Resolve against the SERVER's product list — never trust prices
    // sent from the browser.
    const items = [];
    for (let i = 0; i < rawItems.length; i++) {
      const product = PRODUCTS.find((p) => p.id === rawItems[i].id);
      const qty = Math.max(1, Math.floor(Number(rawItems[i].qty) || 0));
      if (!product || qty < 1) {
        return res.status(400).json({ error: `Unknown item or bad quantity: ${rawItems[i].id}` });
      }
      items.push({ product, index: PRODUCTS.indexOf(product), qty });
    }

    const subtotal = items.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    const invoiceSeq = nextInvoiceSeq();
    const now = new Date();

    const order = {
      invoiceSeq,
      items,
      customer: { name: customer.name, phone: customer.phone, pin: customer.pin || null },
      paymentMethod: body.paymentMethod || "cash",
      notes: body.notes || null,
    };

    const receipt = {
      business: {
        name: process.env.BUSINESS_NAME || "FARMTEK09 CENTRE",
        pin: process.env.BUSINESS_PIN || null,
        address: process.env.BUSINESS_ADDRESS || "Lower Kabete, Nairobi",
        phone: process.env.BUSINESS_PHONE || "0725528888",
      },
      receiptNo: `FARMTEK-${String(invoiceSeq).padStart(6, "0")}`,
      receiptLabel: "Normal Sale",
      dateTime: now.toLocaleString("en-KE"),
      customer: order.customer,
      items: items.map((l) => ({
        name: l.product.name,
        qty: l.qty,
        unit: l.product.unit,
        price: l.product.price,
        lineTotal: l.product.price * l.qty,
      })),
      subtotal,
      taxTotal: 0,
      total: subtotal,
      paymentMethod: order.paymentMethod,
      etims: { configured: false },
    };

    if (etims.isEnabled()) {
      try {
        const result = await etims.submitInvoice(order);
        receipt.etims = {
          configured: true,
          kraInvoiceNo: result.kraInvoiceNo,
          scuId: result.scuId,
          signature: result.signature,
        };
      } catch (err) {
        console.error("eTIMS submission failed:", err.message);
        // eTIMS is turned on but the KRA call failed — don't hand out a
        // receipt that implies KRA registration when it didn't happen.
        return res.status(502).json({ error: "Could not register this sale with KRA eTIMS. Order was not completed — please retry." });
      }
    }

    res.json(receipt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected server error." });
  }
});

app.get("/", (req, res) => {
  res.send("FARMTEK09 CENTRE checkout API is running.");
});

app.listen(PORT, () => {
  console.log(`Checkout server listening on port ${PORT} (eTIMS enabled: ${etims.isEnabled()})`);
});
