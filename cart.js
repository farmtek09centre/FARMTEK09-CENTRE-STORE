/**
 * FARMTEK09 CENTRE — Cart engine.
 * Include AFTER products.js on every page:
 *   <script src="products.js"></script>
 *   <script src="cart.js" defer></script>
 *
 * What this file does, with no HTML rewrite needed beyond:
 *   1. a `data-product-id="X"` on a `.product-card` (listing) or
 *      `.add-to-cart-block` (product detail page) element, and
 *   2. one nav link with id="ft-cart-nav-link" for the cart icon.
 * Everything else (drawer, quantity steppers, badge) is injected
 * by this script so the existing page markup stays untouched.
 *
 * Cart is stored in the browser's localStorage so it survives
 * navigation between pages of this static, multi-page site.
 */
(function () {
  const STORAGE_KEY = "farmtek09_cart_v1";

  function getProducts() {
    return typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  }

  function findProduct(id) {
    return getProducts().find((p) => p.id === id);
  }

  function formatKES(amount) {
    return "KES " + Math.round(amount).toLocaleString("en-KE");
  }

  // ---- Cart storage --------------------------------------------------

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      // Storage unavailable (private mode, quota) — cart just won't persist.
    }
  }

  let cart = loadCart();

  function setQty(id, qty) {
    qty = Math.max(0, Math.floor(qty) || 0);
    if (qty === 0) {
      delete cart[id];
    } else {
      cart[id] = qty;
    }
    saveCart(cart);
    renderAll();
  }

  function addToCart(id, qty) {
    qty = Math.max(1, Math.floor(qty) || 1);
    cart[id] = (cart[id] || 0) + qty;
    saveCart(cart);
    renderAll();
    openDrawer();
  }

  function cartLines() {
    return Object.keys(cart)
      .map((id) => {
        const product = findProduct(id);
        if (!product) return null;
        return { product, qty: cart[id], lineTotal: product.price * cart[id] };
      })
      .filter(Boolean);
  }

  function cartCount() {
    return Object.values(cart).reduce((sum, q) => sum + q, 0);
  }

  function cartSubtotal() {
    return cartLines().reduce((sum, line) => sum + line.lineTotal, 0);
  }

  function clearCart() {
    cart = {};
    saveCart(cart);
    renderAll();
  }

  // ---- Drawer ----------------------------------------------------------

  function injectDrawer() {
    if (document.getElementById("ft-cart-drawer")) return;

    const overlay = document.createElement("div");
    overlay.id = "ft-cart-overlay";
    overlay.className = "ft-cart-overlay";

    const drawer = document.createElement("aside");
    drawer.id = "ft-cart-drawer";
    drawer.className = "ft-cart-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = [
      '<div class="ft-cart-header">',
      "<h3>Your Cart</h3>",
      '<button type="button" id="ft-cart-close" class="ft-cart-close" aria-label="Close cart">&times;</button>',
      "</div>",
      '<div id="ft-cart-items" class="ft-cart-items"></div>',
      '<div class="ft-cart-footer">',
      '<div class="ft-cart-subtotal"><span>Subtotal</span><span id="ft-cart-subtotal-amount">KES 0</span></div>',
      '<a href="checkout.html" id="ft-cart-checkout-btn" class="ft-cart-checkout-btn">Proceed to Checkout</a>',
      "</div>",
    ].join("");

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    overlay.addEventListener("click", closeDrawer);
    document.getElementById("ft-cart-close").addEventListener("click", closeDrawer);
  }

  function openDrawer() {
    const drawer = document.getElementById("ft-cart-drawer");
    const overlay = document.getElementById("ft-cart-overlay");
    if (!drawer || !overlay) return;
    drawer.classList.add("open");
    overlay.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    const drawer = document.getElementById("ft-cart-drawer");
    const overlay = document.getElementById("ft-cart-overlay");
    if (!drawer || !overlay) return;
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }

  function renderDrawer() {
    const itemsEl = document.getElementById("ft-cart-items");
    const subtotalEl = document.getElementById("ft-cart-subtotal-amount");
    if (!itemsEl || !subtotalEl) return;

    const lines = cartLines();
    if (lines.length === 0) {
      itemsEl.innerHTML = '<p class="ft-cart-empty">Your cart is empty.</p>';
    } else {
      itemsEl.innerHTML = lines
        .map(
          (line) => `
        <div class="ft-cart-line" data-line-id="${line.product.id}">
          <div class="ft-cart-line-info">
            <span class="ft-cart-line-name">${line.product.name}</span>
            <span class="ft-cart-line-price">${formatKES(line.product.price)} / ${line.product.unit}</span>
          </div>
          <div class="ft-qty-stepper" data-id="${line.product.id}">
            <button type="button" class="ft-qty-btn ft-qty-minus" aria-label="Decrease quantity">−</button>
            <span class="ft-qty-value">${line.qty}</span>
            <button type="button" class="ft-qty-btn ft-qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <span class="ft-cart-line-total">${formatKES(line.lineTotal)}</span>
        </div>`
        )
        .join("");
    }
    subtotalEl.textContent = formatKES(cartSubtotal());
  }

  function renderBadge() {
    const badge = document.getElementById("ft-cart-count");
    if (badge) badge.textContent = String(cartCount());
  }

  // ---- Add-to-cart controls on listing/detail pages ---------------------

  function buildControlsHTML(product, compact) {
    const stepperId = "qty-" + product.id;
    return `
      <div class="ft-atc" data-id="${product.id}">
        <span class="ft-atc-price">${formatKES(product.price)} <small>/ ${product.unit}</small></span>
        <div class="ft-qty-stepper ft-atc-stepper" data-id="${product.id}">
          <button type="button" class="ft-qty-btn ft-qty-minus" aria-label="Decrease quantity">−</button>
          <span class="ft-qty-value" id="${stepperId}">1</span>
          <button type="button" class="ft-qty-btn ft-qty-plus" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="ft-add-btn">${compact ? "Add" : "Add to Cart"}</button>
      </div>`;
  }

  function wireAddToCartBlock(container, product) {
    let localQty = 1;
    const stepper = container.querySelector(".ft-atc-stepper");
    const valueEl = stepper.querySelector(".ft-qty-value");

    stepper.querySelector(".ft-qty-minus").addEventListener("click", (e) => {
      e.preventDefault();
      localQty = Math.max(1, localQty - 1);
      valueEl.textContent = String(localQty);
    });
    stepper.querySelector(".ft-qty-plus").addEventListener("click", (e) => {
      e.preventDefault();
      localQty += 1;
      valueEl.textContent = String(localQty);
    });
    container.querySelector(".ft-add-btn").addEventListener("click", (e) => {
      e.preventDefault();
      addToCart(product.id, localQty);
    });
  }

  function injectProductControls() {
    document.querySelectorAll(".product-card[data-product-id]").forEach((card) => {
      const product = findProduct(card.getAttribute("data-product-id"));
      if (!product || card.querySelector(".ft-atc")) return;
      card.insertAdjacentHTML("beforeend", buildControlsHTML(product, true));
      wireAddToCartBlock(card, product);
    });

    document.querySelectorAll(".add-to-cart-block[data-product-id]").forEach((block) => {
      const product = findProduct(block.getAttribute("data-product-id"));
      if (!product || block.querySelector(".ft-atc")) return;
      block.innerHTML = buildControlsHTML(product, false);
      wireAddToCartBlock(block, product);
    });
  }

  // ---- Drawer line qty +/- and remove -----------------------------------

  function wireDrawerEvents() {
    const itemsEl = document.getElementById("ft-cart-items");
    if (!itemsEl) return;
    itemsEl.addEventListener("click", (e) => {
      const stepper = e.target.closest(".ft-qty-stepper");
      if (!stepper) return;
      const id = stepper.getAttribute("data-id");
      const current = cart[id] || 0;
      if (e.target.classList.contains("ft-qty-plus")) {
        setQty(id, current + 1);
      } else if (e.target.classList.contains("ft-qty-minus")) {
        setQty(id, current - 1);
      }
    });
  }

  // ---- Nav cart icon ------------------------------------------------------

  function injectNavCartLink() {
    document.querySelectorAll(".navbar ul").forEach((ul) => {
      if (ul.querySelector("#ft-cart-nav-link")) return;
      const li = document.createElement("li");
      li.innerHTML = '<a href="checkout.html" id="ft-cart-nav-link" class="ft-cart-nav-link">🛒 <span id="ft-cart-count" class="ft-cart-count">0</span></a>';
      ul.appendChild(li);
    });

    document.querySelectorAll("#ft-cart-nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        // On the checkout page itself, let the link behave normally (no-op there anyway).
        if (window.location.pathname.endsWith("checkout.html")) return;
        e.preventDefault();
        openDrawer();
      });
    });
  }

  function renderAll() {
    renderBadge();
    renderDrawer();
  }

  function init() {
    injectDrawer();
    injectNavCartLink();
    injectProductControls();
    wireDrawerEvents();
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Exposed for checkout.html
  window.FarmtekCart = {
    lines: cartLines,
    count: cartCount,
    subtotal: cartSubtotal,
    setQty: setQty,
    clear: clearCart,
    formatKES: formatKES,
  };
})();
