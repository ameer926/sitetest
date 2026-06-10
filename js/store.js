/* ==========================================================================
   NOVA store page — product rendering, category filtering, cart drawer
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Product catalogue ---------- */
  const PRODUCTS = [
    { id: "p1", name: "Aero Wireless Headphones", category: "Electronics", price: 129.0, oldPrice: 179.0, emoji: "🎧", rating: 4.8, reviews: 214, badge: "sale" },
    { id: "p2", name: "Classic Cotton Tee", category: "Apparel", price: 28.0, emoji: "👕", rating: 4.6, reviews: 530, badge: null },
    { id: "p3", name: "Aroma Ceramic Mug", category: "Home", price: 18.5, emoji: "☕", rating: 4.9, reviews: 96, badge: "new" },
    { id: "p4", name: "Trail Runner Sneakers", category: "Apparel", price: 89.0, emoji: "👟", rating: 4.7, reviews: 342, badge: null },
    { id: "p5", name: "Lumen Smart Watch", category: "Electronics", price: 199.0, oldPrice: 249.0, emoji: "⌚", rating: 4.5, reviews: 178, badge: "sale" },
    { id: "p6", name: "Minimalist Backpack", category: "Accessories", price: 64.0, emoji: "🎒", rating: 4.8, reviews: 271, badge: "new" },
    { id: "p7", name: "Scented Soy Candle", category: "Home", price: 22.0, emoji: "🕯️", rating: 4.9, reviews: 410, badge: null },
    { id: "p8", name: "Polarised Sunglasses", category: "Accessories", price: 49.0, emoji: "🕶️", rating: 4.4, reviews: 133, badge: null },
    { id: "p9", name: "Portable Bluetooth Speaker", category: "Electronics", price: 59.0, oldPrice: 79.0, emoji: "🔊", rating: 4.6, reviews: 188, badge: "sale" },
    { id: "p10", name: "Cozy Knit Beanie", category: "Apparel", price: 24.0, emoji: "🧢", rating: 4.7, reviews: 88, badge: null },
    { id: "p11", name: "Indoor Plant Pot", category: "Home", price: 34.0, emoji: "🪴", rating: 4.8, reviews: 152, badge: "new" },
    { id: "p12", name: "Leather Card Wallet", category: "Accessories", price: 39.0, emoji: "👛", rating: 4.5, reviews: 204, badge: null },
  ];

  /* ---------- State ---------- */
  const STORAGE_KEY = "nova_cart";
  let cart = loadCart();
  let activeCategory = "all";

  /* ---------- Element refs ---------- */
  const grid = document.getElementById("productGrid");
  const filters = document.getElementById("categoryFilters");
  const cartCount = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartFooter = document.getElementById("cartFooter");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");

  /* ---------- Utilities ---------- */
  function money(n) {
    return "$" + n.toFixed(2);
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      /* storage unavailable — cart stays in memory for the session */
    }
  }

  function getProduct(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function starString(rating) {
    const full = Math.round(rating);
    return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
  }

  /* ---------- Render products ---------- */
  function renderProducts() {
    const list =
      activeCategory === "all"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === activeCategory);

    grid.innerHTML = list
      .map(function (p) {
        const badge = p.badge
          ? `<span class="product-badge ${p.badge}">${
              p.badge === "sale" ? "Sale" : "New"
            }</span>`
          : "";
        const oldPrice = p.oldPrice
          ? `<span class="old">${money(p.oldPrice)}</span>`
          : "";
        return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-media">
            ${badge}
            <button class="wishlist-btn" aria-label="Add to wishlist" data-wishlist>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg>
            </button>
            <span aria-hidden="true">${p.emoji}</span>
          </div>
          <div class="product-body">
            <div class="product-category">${p.category}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-rating">
              <span class="stars" aria-hidden="true">${starString(p.rating)}</span>
              <span>${p.rating.toFixed(1)} (${p.reviews})</span>
            </div>
            <div class="product-footer">
              <div class="product-price">${oldPrice}${money(p.price)}</div>
              <button class="add-btn" data-add aria-label="Add ${p.name} to cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  /* ---------- Cart logic ---------- */
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    const p = getProduct(id);
    showToast(`${p.name} added to cart`);
    bumpCartIcon();
  }

  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id] += delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    delete cart[id];
    saveCart();
    renderCart();
  }

  function cartItemCount() {
    return Object.values(cart).reduce((sum, q) => sum + q, 0);
  }

  function cartTotal() {
    return Object.keys(cart).reduce(function (sum, id) {
      const p = getProduct(id);
      return p ? sum + p.price * cart[id] : sum;
    }, 0);
  }

  function renderCart() {
    const count = cartItemCount();
    cartCount.textContent = count;
    cartCount.classList.toggle("show", count > 0);

    const ids = Object.keys(cart);
    if (ids.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <div class="emoji">🛒</div>
          <p>Your cart is empty.</p>
        </div>`;
      cartFooter.hidden = true;
      return;
    }

    cartItems.innerHTML = ids
      .map(function (id) {
        const p = getProduct(id);
        if (!p) return "";
        const qty = cart[id];
        return `
        <div class="cart-item" data-id="${id}">
          <div class="cart-item-media" aria-hidden="true">${p.emoji}</div>
          <div class="cart-item-info">
            <h4>${p.name}</h4>
            <div class="price">${money(p.price)}</div>
            <div class="cart-item-controls">
              <div class="qty-control">
                <button data-dec aria-label="Decrease quantity">−</button>
                <span>${qty}</span>
                <button data-inc aria-label="Increase quantity">+</button>
              </div>
              <button class="remove-item" data-remove>Remove</button>
            </div>
          </div>
        </div>`;
      })
      .join("");

    cartSubtotal.textContent = money(cartTotal());
    cartFooter.hidden = false;
  }

  function bumpCartIcon() {
    cartCount.style.transition = "none";
    cartCount.style.transform = "scale(1.4)";
    requestAnimationFrame(function () {
      cartCount.style.transition = "";
      cartCount.style.transform = "";
    });
  }

  /* ---------- Cart drawer open/close ---------- */
  function openCart() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  /* ---------- Event wiring ---------- */
  // Product grid clicks (add to cart, wishlist) — delegated
  grid.addEventListener("click", function (e) {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const id = card.dataset.id;

    if (e.target.closest("[data-add]")) {
      addToCart(id);
      openCart();
    } else if (e.target.closest("[data-wishlist]")) {
      e.target.closest("[data-wishlist]").classList.toggle("active");
    }
  });

  // Category filters — delegated
  filters.addEventListener("click", function (e) {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    filters
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.toggle("active", c === chip));
    renderProducts();
  });

  // Cart item controls — delegated
  cartItems.addEventListener("click", function (e) {
    const item = e.target.closest(".cart-item");
    if (!item) return;
    const id = item.dataset.id;
    if (e.target.closest("[data-inc]")) changeQty(id, 1);
    else if (e.target.closest("[data-dec]")) changeQty(id, -1);
    else if (e.target.closest("[data-remove]")) removeFromCart(id);
  });

  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCart();
  });

  // Newsletter
  document
    .getElementById("newsletterForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      this.reset();
      showToast("You're subscribed! Check your inbox 🎉");
    });

  // Mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      const open = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    mainNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Init ---------- */
  renderProducts();
  renderCart();
})();
