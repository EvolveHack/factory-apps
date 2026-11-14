import type { ReactNode } from "react";

export type ShopCustomer = "willow" | "summit";

export interface Product {
  id: string;
  name: string;
  /** Price in dollars. */
  price: number;
  category: string;
  emoji: string;
  /** Background color of the product tile. */
  tint: string;
  rating: number;
  blurb: string;
}

export interface OrderLine {
  productId: string;
  qty: number;
}

export interface Order {
  id: string;
  /** Display date, for example "Nov 8, 2026". Newest order comes first. */
  date: string;
  status: string;
  items: OrderLine[];
}

export interface TenantConfig {
  name: string;
  shopperName: string;
  colors: {
    /** Main brand color: buttons, active tab, badges. */
    brand: string;
    /** Text color on top of the brand color. */
    brandText: string;
    /** Soft accent: hero background, chips. */
    accent: string;
    /** App background. */
    background: string;
  };
  hero: { eyebrow: string; title: string; subtitle: string; cta: string; emoji: string };
  categories: { id: string; name: string; emoji: string }[];
  products: Product[];
  orders: Order[];
}

export interface Flags {
  newCheckout: boolean;
}

export type Screen =
  | { name: "home" }
  | { name: "product"; productId: string }
  | { name: "cart" }
  | { name: "orders" };

export interface CartLine {
  product: Product;
  qty: number;
}

/** Everything a feature slot can read or do. */
export interface Shop {
  customer: ShopCustomer;
  config: TenantConfig;
  flags: Flags;
  products: Product[];
  /** Past orders, newest first (seeded, plus any placed in this visit). */
  orders: Order[];
  cart: CartLine[];
  cartCount: number;
  cartTotal: number;
  productById: (id: string) => Product | undefined;
  orderTotal: (order: Order) => number;
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  open: (screen: Screen) => void;
  /** Show a short message at the top of the app. */
  notify: (message: string) => void;
  formatPrice: (dollars: number) => string;
}

export interface SlotProps {
  shop: Shop;
}
export interface ProductSlotProps extends SlotProps {
  product: Product;
}
export interface OrderSlotProps extends SlotProps {
  order: Order;
}

export interface Features {
  HomeTop: (props: SlotProps) => ReactNode;
  HomeSection: (props: SlotProps) => ReactNode;
  ProductActions: (props: ProductSlotProps) => ReactNode;
  CartExtras: (props: SlotProps) => ReactNode;
  OrderActions: (props: OrderSlotProps) => ReactNode;
}

export interface Tenant {
  config: TenantConfig;
  flags: Flags;
  features: Features;
}
