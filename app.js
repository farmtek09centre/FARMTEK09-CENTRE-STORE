/* =========================================================
   EDIT THESE FOR YOUR BUSINESS
   ========================================================= */
const STORE_NAME = "FARMTEK09 CENTRE";
const WHATSAPP_NUMBER = "254725528888";   // international format, digits only, no + or spaces
const PAYBILL_BUSINESS = "400200";        // Co-operative Bank Lipa na M-Pesa business number
const PAYBILL_ACCOUNT = "54095";          // account number
const LOCATION_NAME = "Lower Kabete, Nairobi";
const LOCATION_LAT = -1.2379275;
const LOCATION_LNG = 36.7267739;
const LOCATION_HOURS = "Open daily, 9:00 AM – 5:00 PM";
/* ========================================================= */

const MAPS_EMBED_URL = `https://www.google.com/maps?q=${LOCATION_LAT},${LOCATION_LNG}&z=15&output=embed`;
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${LOCATION_LAT},${LOCATION_LNG}`;

// In-memory cart: { [productId]: quantity }. Resets on page reload by design.
let cart = {};

const CATEGORY_ORDER = ["Bananas & Plantains", "Mangoes", "Avocados", "Tangerines", "Apples", "Grapes", "Lemons"];

const CATEGORY_ICONS = {
  "Bananas & Plantains": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3c-1 5 0 12 6 15 5 2 10-1 11-7-3 2-7 2-9 0"/><path d="M17 4c1 2 1 4 0 6"/></svg>`,
  "Mangoes": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4c4 0 7 4 7 8.5S16 21 12 21s-7-4.5-7-8.5S8 4 12 4Z"/><path d="M12 4c0-1.2.8-2 2-2.4"/></svg>`,
  "Avocados": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3c4 1 6 6 6 10a6 6 0 0 1-12 0c0-4 2-9 6-10Z"/><circle cx="12" cy="14" r="2.6"/></svg>`,
  "Tangerines": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="13" r="8"/><path d="M12 5c1 0 2-1 2-2M9 4l1.5 1.5"/></svg>`,
  "Apples": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8c-3-3-8-1-8 4 0 5 4 9 8 9s8-4 8-9c0-5-5-7-8-4Z"/><path d="M12 8V4c0-1 1-2 2-2"/></svg>`,
  "Grapes": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="10" r="2.2"/><circle cx="14" cy="10" r="2.2"/><circle cx="6.5" cy="14.5" r="2.2"/><circle cx="11.5" cy="14.5" r="2.2"/><circle cx="16.5" cy="14.5" r="2.2"/><circle cx="9" cy="19" r="2.2"/><circle cx="14" cy="19" r="2.2"/><path d="M11 6V3M11 3c1.5 0 2-1 2-2"/></svg>`,
  "Lemons": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="12" rx="6.5" ry="8.5"/><path d="M5.7 8c1 .2 1.8-.4 2-1.4M18.3 16c-1-.2-1.8.4-2 1.4"/></svg>`,
};

const WHATSAPP_GLYPH = `<svg viewBox="0 0 32 32"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.35.65 4.55 1.78 6.43L4 29l7.72-1.75a12.9 12.9 0 0 0 4.3.74h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3Zm7.05 17.13c-.3.83-1.7 1.6-2.36 1.7-.6.1-1.37.14-2.2-.14-.5-.16-1.16-.38-1.99-.75-3.5-1.52-5.79-5.05-5.97-5.29-.17-.24-1.43-1.9-1.43-3.63s.9-2.57 1.23-2.93c.32-.35.7-.44.94-.44.23 0 .47 0 .67.01.22.01.5-.08.78.6.3.7.99 2.44 1.08 2.62.09.17.15.38.03.62-.12.24-.18.38-.35.58-.18.2-.37.45-.53.6-.18.17-.36.36-.16.7.21.34.92 1.52 1.98 2.46 1.36 1.21 2.5 1.59 2.85 1.77.35.17.55.14.75-.08.2-.23.87-1 1.1-1.35.23-.35.46-.29.77-.17.32.12 2.02.95 2.37 1.13.35.17.58.26.66.4.09.15.09.85-.22 1.67Z"/></svg>`;

const CART_GLYPH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6"/></svg>`;

let allProducts = [];
let activeCategory = "All";
let searchTerm = "";

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function genericGreeting() {
  return `Hi ${STORE_NAME}! I'd like to know more about your seedlings.`;
}

function orderMessage(p) {
  if (p.price == null) {
    return `Hi! I'd like to enquire about:\n\n${p.name}\n\nCould you let me know the price and availability?`;
  }
  return `Hi! I'd like to order:\n\n${p.name}\nPrice: Ksh ${p.price.toLocaleString()}\n\nI'll pay via M-Pesa Paybill ${PAYBILL_BUSINESS}, Account ${PAYBILL_ACCOUNT} (${STORE_NAME}) — please confirm availability.`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function mediaHtml(p) {
  if (p.image) return `<img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" width="300" height="300">`;
  return CATEGORY_ICONS[p.category] || CATEGORY_ICONS["Mangoes"];
}

function priceHtml(p) {
  if (p.price == null) return `<span class="card-price on-request">Price on request</span>`;
  return `<span class="card-price">Ksh ${p.price.toLocaleString()}</span>`;
}

function cardHtml(p) {
  const media = `<div class="card-media">${mediaHtml(p)}</div>`;
  const head = `
      <p class="card-category">${escapeHtml(p.category)}</p>
      <p class="card-name">${escapeHtml(p.name)}</p>
      ${priceHtml(p)}`;

  if (p.price == null) {
    // No price yet — quantity/cart doesn't apply, keep the direct WhatsApp enquiry.
    return `
    <article class="card">
      ${media}
      <div class="card-body">
        ${head}
        <a class="btn btn-order card-cta" href="${waLink(orderMessage(p))}" target="_blank" rel="noopener">
          ${WHATSAPP_GLYPH.replace('viewBox="0 0 32 32"', 'viewBox="0 0 32 32" width="16" height="16"')} Enquire on WhatsApp
        </a>
      </div>
    </article>`;
  }

  return `
    <article class="card" data-product-id="${p.id}">
      ${media}
      <div class="card-body">
        ${head}
        <div class="qty-stepper" data-qty-for="${p.id}">
          <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>
          <span class="qty-value" data-qty-value>1</span>
          <button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="btn btn-order card-cta" data-add-to-cart="${p.id}">Add to Cart</button>
      </div>
    </article>`;
}

function render() {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");
  const countEl = document.getElementById("resultCount");
  const term = searchTerm.trim().toLowerCase();

  const filtered = allProducts.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = !term || p.name.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  countEl.textContent = `Showing ${filtered.length} of ${allProducts.length} products`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    grid.hidden = true;
    empty.hidden = false;
    document.getElementById("emptyQuery").textContent = searchTerm || "this category";
  } else {
    empty.hidden = true;
    grid.hidden = false;
    grid.innerHTML = filtered.map(cardHtml).join("");
  }
}

function buildCategoryPills() {
  const counts = {};
  allProducts.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
  const cats = CATEGORY_ORDER.filter((c) => counts[c]);
  const pillsHtml = [`<button class="pill active" data-cat="All">All (${allProducts.length})</button>`]
    .concat(cats.map((c) => `<button class="pill" data-cat="${escapeHtml(c)}">${escapeHtml(c)} (${counts[c]})</button>`))
    .join("");
  const wrap = document.getElementById("categoryPills");
  wrap.innerHTML = pillsHtml;
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    wrap.querySelectorAll(".pill").forEach((p) => p.classList.toggle("active", p === btn));
    render();
  });
}

function buildShelf() {
  const withPhotos = allProducts.filter((p) => p.image);
  const pool = (withPhotos.length >= 8 ? withPhotos : allProducts).slice(0, 14);
  const tags = pool.map((p) => `
      <div class="shelf-tag">
        <div class="shelf-tag-media">${mediaHtml(p)}</div>
        <div class="shelf-tag-name">${escapeHtml(p.name)}</div>
        <div class="shelf-tag-price">${p.price == null ? "Ask price" : "Ksh " + p.price.toLocaleString()}</div>
      </div>`).join("");
  document.getElementById("shelfTrack").innerHTML = tags + tags;
}

function wireWhatsappLinks() {
  const generic = waLink(genericGreeting());
  ["topbarWhatsapp", "heroWhatsapp", "footerWhatsapp", "floatingWhatsapp", "locationWhatsapp"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = generic;
  });
}

function applyBranding() {
  document.title = `${STORE_NAME} — Order on WhatsApp`;
  document.querySelectorAll(".js-store-name").forEach((el) => (el.textContent = STORE_NAME));
  document.querySelectorAll(".js-location-name").forEach((el) => (el.textContent = LOCATION_NAME));
  document.querySelectorAll(".js-hours").forEach((el) => (el.textContent = LOCATION_HOURS));
  document.querySelectorAll(".js-paybill-business").forEach((el) => (el.textContent = PAYBILL_BUSINESS));
  document.querySelectorAll(".js-paybill-account").forEach((el) => (el.textContent = PAYBILL_ACCOUNT));
  const mapFrame = document.getElementById("mapFrame");
  if (mapFrame) mapFrame.src = MAPS_EMBED_URL;
  const directionsLink = document.getElementById("directionsLink");
  if (directionsLink) directionsLink.href = MAPS_DIRECTIONS_URL;
}

function wireCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const defaultLabel = btn.textContent;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = defaultLabel;
          btn.classList.remove("copied");
        }, 1800);
      } catch (err) {
        // Clipboard API unavailable — the number is already visible on the page.
      }
    });
  });
}

function wireControls() {
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    render();
  });
  document.getElementById("clearFilters").addEventListener("click", () => {
    searchTerm = "";
    activeCategory = "All";
    document.getElementById("searchInput").value = "";
    document.querySelectorAll(".pill").forEach((p) => p.classList.toggle("active", p.dataset.cat === "All"));
    render();
  });
}

/* =========================================================
   Cart: quantity stepper on each card, cart modal, checkout via WhatsApp
   ========================================================= */

function findProduct(id) {
  return allProducts.find((p) => p.id === id);
}

function cartCount() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = findProduct(id);
    return sum + (p && p.price != null ? p.price * qty : 0);
  }, 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  const count = cartCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}

function addToCart(id, qty) {
  if (!qty || qty < 1) return;
  cart[id] = qty;
  updateCartBadge();
}

function changeCartLine(id, delta) {
  const p = findProduct(id);
  if (!p) return;
  const next = (cart[id] || 0) + delta;
  if (next <= 0) {
    delete cart[id];
  } else {
    cart[id] = next;
  }
  updateCartBadge();
  renderCartModal();
}

function removeCartLine(id) {
  delete cart[id];
  updateCartBadge();
  renderCartModal();
}

function cartLineHtml(id, qty) {
  const p = findProduct(id);
  if (!p) return "";
  const lineTotal = p.price * qty;
  return `
    <div class="cart-line" data-cart-line="${id}">
      <div class="cart-line-media">${mediaHtml(p)}</div>
      <div class="cart-line-info">
        <p class="cart-line-name">${escapeHtml(p.name)}</p>
        <p class="cart-line-unit">Ksh ${p.price.toLocaleString()} each</p>
        <div class="qty-stepper qty-stepper-sm">
          <button type="button" class="qty-btn" data-cart-step="${id}" data-step="-1" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${qty}</span>
          <button type="button" class="qty-btn" data-cart-step="${id}" data-step="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-line-right">
        <span class="cart-line-total">Ksh ${lineTotal.toLocaleString()}</span>
        <button type="button" class="cart-line-remove" data-cart-remove="${id}" aria-label="Remove item">Remove</button>
      </div>
    </div>`;
}

function renderCartModal() {
  const body = document.getElementById("cartBody");
  const footer = document.getElementById("cartFooter");
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    body.innerHTML = `<p class="cart-empty">Your cart is empty. Browse the seedlings and tap "Add to Cart" on any item.</p>`;
    footer.hidden = true;
    return;
  }

  body.innerHTML = entries.map(([id, qty]) => cartLineHtml(id, qty)).join("");
  footer.hidden = false;
  document.getElementById("cartTotal").textContent = `Ksh ${cartTotal().toLocaleString()}`;
}

function buildCheckoutMessage() {
  const lines = Object.entries(cart).map(([id, qty]) => {
    const p = findProduct(id);
    return `${qty}x ${p.name} @ Ksh ${p.price.toLocaleString()} = Ksh ${(p.price * qty).toLocaleString()}`;
  });
  return `Hi! I'd like to order:\n\n${lines.join("\n")}\n\nTotal: Ksh ${cartTotal().toLocaleString()}\n\nI'll pay via M-Pesa Paybill ${PAYBILL_BUSINESS}, Account ${PAYBILL_ACCOUNT} (${STORE_NAME}) — please confirm availability.`;
}

function openCart() {
  renderCartModal();
  document.getElementById("cartOverlay").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCart() {
  document.getElementById("cartOverlay").hidden = true;
  document.body.style.overflow = "";
}

function wireCart() {
  document.getElementById("cartButton").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", (e) => {
    if (e.target.id === "cartOverlay") closeCart();
  });

  // Quantity steppers on product cards (event delegation — cards re-render on filter/search)
  document.getElementById("productGrid").addEventListener("click", (e) => {
    const stepBtn = e.target.closest(".qty-btn[data-step]");
    if (stepBtn && stepBtn.closest("[data-qty-for]")) {
      const wrap = stepBtn.closest("[data-qty-for]");
      const valueEl = wrap.querySelector("[data-qty-value]");
      const next = Math.max(1, parseInt(valueEl.textContent, 10) + parseInt(stepBtn.dataset.step, 10));
      valueEl.textContent = next;
      return;
    }
    const addBtn = e.target.closest("[data-add-to-cart]");
    if (addBtn) {
      const id = addBtn.dataset.addToCart;
      const card = addBtn.closest(".card");
      const qty = parseInt(card.querySelector("[data-qty-value]").textContent, 10);
      addToCart(id, qty);
      const original = addBtn.textContent;
      addBtn.textContent = "Added!";
      addBtn.classList.add("copied");
      setTimeout(() => {
        addBtn.textContent = original;
        addBtn.classList.remove("copied");
      }, 1200);
    }
  });

  // Quantity +/- and remove inside the cart modal itself
  document.getElementById("cartBody").addEventListener("click", (e) => {
    const stepBtn = e.target.closest("[data-cart-step]");
    if (stepBtn) {
      changeCartLine(stepBtn.dataset.cartStep, parseInt(stepBtn.dataset.step, 10));
      return;
    }
    const removeBtn = e.target.closest("[data-cart-remove]");
    if (removeBtn) removeCartLine(removeBtn.dataset.cartRemove);
  });

  document.getElementById("checkoutBtn").addEventListener("click", () => {
    if (Object.keys(cart).length === 0) return;
    window.open(waLink(buildCheckoutMessage()), "_blank", "noopener");

    // Show a confirmation as the last thing the customer sees — no flash of
    // an empty cart, no premature close. This *is* the end of checkout.
    document.getElementById("cartBody").innerHTML = `
      <p class="cart-sent">✓ Order sent — check WhatsApp to confirm with us.</p>`;
    document.getElementById("cartFooter").hidden = true;

    cart = {};
    updateCartBadge();

    setTimeout(() => {
      closeCart();
      renderCartModal();
    }, 1600);
  });
}

async function init() {
  applyBranding();
  allProducts = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  document.getElementById("floatingWhatsapp").innerHTML = WHATSAPP_GLYPH;
  document.getElementById("topbarWhatsapp").innerHTML = `${WHATSAPP_GLYPH.replace('viewBox="0 0 32 32"', 'viewBox="0 0 32 32" width="16" height="16"')} 0725 528 888`;
  wireWhatsappLinks();
  wireCopyButtons();
  wireCart();
  buildCategoryPills();
  buildShelf();
  wireControls();
  render();
}

init();
