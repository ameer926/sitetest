# NOVA — 2-Page Store Template

A lightweight, dependency-free website template built with plain HTML, CSS and
JavaScript. No build step required — open the files directly or serve the
folder with any static server.

## Pages

| File            | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `index.html`    | **E-commerce store** — hero, feature strip, filterable product grid, promo, newsletter, and a working slide-out cart. |
| `tracking.html` | **Order tracking** — order lookup, status timeline, shipping map, activity log, and order summary. |

## Structure

```
.
├── index.html        # Store page
├── tracking.html     # Order tracking page
├── css/
│   └── styles.css    # Shared design system + page styles
└── js/
    ├── store.js      # Product catalogue, category filter, cart drawer
    └── tracking.js   # Order lookup + status visualisation
```

## Features

**Store page**

- Responsive, filterable product grid (All / Electronics / Apparel / Home / Accessories)
- Slide-out cart with quantity controls, subtotal, and `localStorage` persistence
- Wishlist toggles, toast notifications, newsletter signup
- Sticky header with mobile hamburger nav

**Tracking page**

- Search by order number with a simulated async lookup (`fetchOrder`)
- Animated 4-stage progress bar (Order placed → Processing → Shipped → Delivered)
- Shipment activity timeline, animated route map, and itemised order summary
- Deep-linkable: `tracking.html?order=NOVA-100423`

### Sample order numbers

The tracking page ships with mock data so you can see each state:

| Order number   | State        |
| -------------- | ------------ |
| `NOVA-100423`  | In transit   |
| `NOVA-100517`  | Delivered    |
| `NOVA-100688`  | Processing   |

## Running locally

It's fully static, so any of these work:

```bash
# Option 1 — just open it
open index.html

# Option 2 — serve the folder (recommended; avoids file:// quirks)
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Customising

- **Branding & colours:** edit the CSS variables in `:root` at the top of `css/styles.css`.
- **Products:** edit the `PRODUCTS` array in `js/store.js`.
- **Orders / shipping data:** edit the `ORDERS` object in `js/tracking.js`, or
  replace the `fetchOrder()` stub with a real API call.
