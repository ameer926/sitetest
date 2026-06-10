/* ==========================================================================
   NOVA tracking page — order lookup + status visualisation
   Uses mock order data; swap fetchOrder() for a real API call in production.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Pipeline definition ---------- */
  // The four canonical stages every order passes through. `stage` on an order
  // is the index of the most recently completed step.
  const STAGES = [
    {
      key: "ordered",
      label: "Order placed",
      icon: '<path d="M9 11V6a3 3 0 0 1 6 0v5"/><rect x="4" y="11" width="16" height="9" rx="2"/>',
    },
    {
      key: "processing",
      label: "Processing",
      icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    },
    {
      key: "shipped",
      label: "Shipped",
      icon: '<path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: '<path d="M20 6 9 17l-5-5"/>',
    },
  ];

  /* ---------- Mock order database ---------- */
  // Keyed by uppercased order number. `stage` indexes into STAGES.
  const ORDERS = {
    "NOVA-100423": {
      id: "NOVA-100423",
      stage: 2, // shipped / in transit
      carrier: "NOVA Express",
      tracking: "1Z-NOVA-88421-77",
      eta: "Thu, June 12",
      origin: "Newark, NJ",
      destination: "Brooklyn, NY",
      stepTimes: ["Jun 8, 9:14 AM", "Jun 8, 4:02 PM", "Jun 9, 7:30 AM", ""],
      events: [
        { title: "In transit to destination", location: "Jersey City, NJ", time: "Jun 10, 6:45 AM", active: true },
        { title: "Departed shipping facility", location: "Newark, NJ", time: "Jun 9, 7:30 AM" },
        { title: "Package shipped", location: "Newark, NJ", time: "Jun 8, 4:02 PM" },
        { title: "Order processed", location: "Fulfilment Center", time: "Jun 8, 11:20 AM" },
        { title: "Order placed", location: "Online", time: "Jun 8, 9:14 AM" },
      ],
      items: [
        { name: "Aero Wireless Headphones", emoji: "🎧", qty: 1, price: 129.0 },
        { name: "Aroma Ceramic Mug", emoji: "☕", qty: 2, price: 18.5 },
      ],
      shipping: 0,
    },
    "NOVA-100517": {
      id: "NOVA-100517",
      stage: 3, // delivered
      carrier: "NOVA Express",
      tracking: "1Z-NOVA-90233-12",
      eta: "Delivered Jun 6",
      origin: "Austin, TX",
      destination: "Dallas, TX",
      stepTimes: ["Jun 3, 2:10 PM", "Jun 3, 6:40 PM", "Jun 4, 8:05 AM", "Jun 6, 1:22 PM"],
      events: [
        { title: "Delivered — left at front door", location: "Dallas, TX", time: "Jun 6, 1:22 PM", active: true },
        { title: "Out for delivery", location: "Dallas, TX", time: "Jun 6, 7:48 AM" },
        { title: "Arrived at local facility", location: "Dallas, TX", time: "Jun 5, 9:15 PM" },
        { title: "Package shipped", location: "Austin, TX", time: "Jun 3, 6:40 PM" },
        { title: "Order placed", location: "Online", time: "Jun 3, 2:10 PM" },
      ],
      items: [
        { name: "Trail Runner Sneakers", emoji: "👟", qty: 1, price: 89.0 },
        { name: "Cozy Knit Beanie", emoji: "🧢", qty: 1, price: 24.0 },
      ],
      shipping: 0,
    },
    "NOVA-100688": {
      id: "NOVA-100688",
      stage: 1, // processing
      carrier: "NOVA Express",
      tracking: "Pending assignment",
      eta: "Mon, June 16",
      origin: "Seattle, WA",
      destination: "Portland, OR",
      stepTimes: ["Jun 9, 8:55 PM", "Jun 10, 9:30 AM", "", ""],
      events: [
        { title: "Preparing your order", location: "Fulfilment Center", time: "Jun 10, 9:30 AM", active: true },
        { title: "Payment confirmed", location: "Online", time: "Jun 9, 8:56 PM" },
        { title: "Order placed", location: "Online", time: "Jun 9, 8:55 PM" },
      ],
      items: [
        { name: "Lumen Smart Watch", emoji: "⌚", qty: 1, price: 199.0 },
      ],
      shipping: 0,
    },
  };

  /* ---------- Element refs ---------- */
  const form = document.getElementById("trackForm");
  const input = document.getElementById("orderInput");
  const sampleBtn = document.getElementById("sampleBtn");
  const errorEl = document.getElementById("trackError");
  const resultEl = document.getElementById("trackResult");

  /* ---------- Utilities ---------- */
  function money(n) {
    return "$" + n.toFixed(2);
  }

  // Simulated network lookup. Returns a Promise so it reads like a real fetch.
  function fetchOrder(orderNumber) {
    const key = orderNumber.trim().toUpperCase();
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(ORDERS[key] || null);
      }, 450);
    });
  }

  /* ---------- Render ---------- */
  function renderProgress(order) {
    const stepsWrap = document.getElementById("progressSteps");
    stepsWrap.innerHTML = STAGES.map(function (stage, i) {
      let cls = "progress-step";
      if (i < order.stage) cls += " done";
      else if (i === order.stage) cls += order.stage === STAGES.length - 1 ? " done" : " current";

      const isComplete = i <= order.stage;
      const marker = isComplete && (i < order.stage || order.stage === STAGES.length - 1)
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${stage.icon}</svg>`;

      const time = order.stepTimes[i]
        ? `<span class="step-time">${order.stepTimes[i]}</span>`
        : "";

      return `
        <div class="${cls}">
          <div class="step-marker">${marker}</div>
          <span class="step-label">${stage.label}</span>
          ${time}
        </div>`;
    }).join("");

    // Fill the connecting bar proportionally to progress. The bar is inset to
    // the first/last marker centres, so its drawable span is 75% of the wrap
    // (markers sit at 12.5% … 87.5%). Width is that fraction of the full width.
    const SPAN = 75;
    const fraction =
      STAGES.length > 1 ? order.stage / (STAGES.length - 1) : 0;
    const fill = document.getElementById("progressFill");
    // Defer so the transition animates from 0.
    requestAnimationFrame(function () {
      fill.style.width = fraction * SPAN + "%";
    });
  }

  function renderTimeline(order) {
    const wrap = document.getElementById("eventTimeline");
    wrap.innerHTML = order.events
      .map(function (ev) {
        return `
        <div class="timeline-event ${ev.active ? "active" : ""}">
          <div class="event-title">${ev.title}</div>
          <div class="event-meta">${ev.time}</div>
          <div class="event-location">${ev.location}</div>
        </div>`;
      })
      .join("");
  }

  function renderItems(order) {
    const wrap = document.getElementById("orderItems");
    let subtotal = 0;
    wrap.innerHTML = order.items
      .map(function (it) {
        subtotal += it.price * it.qty;
        return `
        <div class="order-item">
          <div class="order-item-media" aria-hidden="true">${it.emoji}</div>
          <div class="order-item-info">
            <h4>${it.name}</h4>
            <span>Qty ${it.qty}</span>
          </div>
          <div class="item-price">${money(it.price * it.qty)}</div>
        </div>`;
      })
      .join("");

    document.getElementById("resSubtotal").textContent = money(subtotal);
    document.getElementById("resShipping").textContent =
      order.shipping > 0 ? money(order.shipping) : "Free";
    document.getElementById("resTotal").textContent = money(
      subtotal + order.shipping
    );
  }

  function renderOrder(order) {
    const isDelivered = order.stage === STAGES.length - 1;

    document.getElementById("resOrderId").textContent = "Order " + order.id;
    document.getElementById("resHeadline").textContent = isDelivered
      ? "Delivered " + order.eta.replace(/^Delivered\s*/i, "")
      : "Arriving " + order.eta;
    document.getElementById("resCarrier").textContent = order.carrier;
    document.getElementById("resTracking").textContent = order.tracking;
    document.getElementById("resEta").textContent = order.eta.replace(
      /^Delivered\s*/i,
      ""
    );
    document.getElementById("mapOrigin").textContent = order.origin;
    document.getElementById("mapDest").textContent = order.destination;

    // Status badge
    const badge = document.getElementById("resStatusBadge");
    const statusText = document.getElementById("resStatusText");
    badge.classList.remove("delivered", "in-transit");
    if (isDelivered) {
      badge.classList.add("delivered");
      statusText.textContent = "Delivered";
    } else if (order.stage === 2) {
      badge.classList.add("in-transit");
      statusText.textContent = "In transit";
    } else if (order.stage === 1) {
      badge.classList.add("in-transit");
      statusText.textContent = "Processing";
    } else {
      badge.classList.add("in-transit");
      statusText.textContent = "Order placed";
    }

    renderProgress(order);
    renderTimeline(order);
    renderItems(order);

    errorEl.hidden = true;
    resultEl.hidden = false;
  }

  /* ---------- Search handling ---------- */
  function lookup(orderNumber) {
    const value = (orderNumber || "").trim();
    if (!value) {
      input.focus();
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]");
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Searching…";
    submitBtn.disabled = true;

    fetchOrder(value).then(function (order) {
      submitBtn.textContent = originalLabel;
      submitBtn.disabled = false;

      if (order) {
        renderOrder(order);
        resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        resultEl.hidden = true;
        errorEl.hidden = false;
        errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  /* ---------- Event wiring ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    lookup(input.value);
  });

  sampleBtn.addEventListener("click", function () {
    input.value = sampleBtn.textContent.trim();
    lookup(input.value);
  });

  // Deep-link support: tracking.html?order=NOVA-100423
  const params = new URLSearchParams(window.location.search);
  const preset = params.get("order");
  if (preset) {
    input.value = preset;
    lookup(preset);
  }

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
})();
