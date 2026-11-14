# Shopping App test ids

| data-testid | Where | Notes |
|---|---|---|
| `phone-frame` | Wrapper around the app | A phone frame on wide screens only |
| `qr-code` | QR code beside the frame | Wide screens only |
| `shop-app` | App root | `data-customer`, `data-screen` (home, product, cart, orders) |
| `brand-name` | Top bar | Retailer name |
| `toast` | Short message at the top | For example "Added ... to your cart" |
| `update-toast` | "This app was just updated" | Shown before the page reloads |
| `nav-home`, `nav-cart`, `nav-orders` | Bottom tab bar | |
| `cart-count` | Badge on the Cart tab | Only when the cart has items |
| `screen-home` | Home screen | |
| `hero` | Home hero | |
| `category-all`, `category-<id>` | Category chips | Filter the grid |
| `product-grid` | Home product grid | |
| `product-card` | One product on Home | `data-product-id` |
| `back` | Product screen top bar | Back to Home |
| `screen-product` | Product screen | `data-product-id` |
| `product-name`, `product-price` | Product screen | |
| `add-to-cart` | Product screen | |
| `screen-cart` | Cart screen | |
| `cart-empty` | Cart screen | Only when the cart is empty |
| `cart-item` | One cart line | `data-product-id` |
| `cart-item-name`, `cart-item-qty` | Inside `cart-item` | |
| `cart-total` | Cart summary | |
| `checkout` | Cart summary | Places a demo order |
| `screen-orders` | Orders screen | |
| `order-card` | One past order | `data-order-id` |
| `slot-HomeTop` | Home, above the hero | Hidden while empty |
| `slot-HomeSection` | Home, below the categories | Hidden while empty |
| `slot-ProductActions` | Product, under Add to cart | Hidden while empty |
| `slot-CartExtras` | Cart, above the summary | Hidden while empty |
| `slot-OrderActions` | Inside each `order-card` | Hidden while empty |

Features added in `tenants/<customer>/features.tsx` add their own ids, for example `reorder-last`.
