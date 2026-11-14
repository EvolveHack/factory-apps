// Feature slots for this retailer only. Shared code renders each one in place.
// Each slot starts empty. See products/shop/AGENTS.md for what goes where.
/* eslint-disable @typescript-eslint/no-unused-vars -- empty slots ignore their props until a feature is added */
import type { OrderSlotProps, ProductSlotProps, SlotProps } from "../../types";

// HomeTop: a banner or button above the hero on the Home screen.
export function HomeTop(_props: SlotProps) {
  return null;
}

// HomeSection: a new section on the Home screen, below the categories.
export function HomeSection(_props: SlotProps) {
  return null;
}

// ProductActions: extra buttons under Add to cart on a product page.
export function ProductActions(_props: ProductSlotProps) {
  return null;
}

// CartExtras: extra rows in the cart, above the order summary.
export function CartExtras(_props: SlotProps) {
  return null;
}

// OrderActions: buttons on each past order on the Orders screen.
export function OrderActions(_props: OrderSlotProps) {
  return null;
}
