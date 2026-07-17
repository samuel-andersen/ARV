/**
 * Arv print pricing — transparent and page-count based, computed the same way
 * on the client (live breakdown) and the server (authoritative amount stored on
 * the order). Prices are whole kroner; amounts are persisted in øre.
 */

export const CURRENCY = "kr";

const BASE_PRICE = 649; // a linen 20×25 cm book, up to INCLUDED_PAGES
const INCLUDED_PAGES = 48;
const PER_EXTRA_PAGE = 8;
export const SHIPPING = 79;
export const MAX_COPIES = 5;

/** Unit price for one copy at a given page count (whole kr). */
export function priceForPages(pages: number): number {
  const extra = Math.max(0, pages - INCLUDED_PAGES);
  return BASE_PRICE + extra * PER_EXTRA_PAGE;
}

export interface PriceBreakdown {
  unit: number;
  copies: number;
  goods: number;
  shipping: number;
  total: number;
}

export function orderTotal(pages: number, copies: number): PriceBreakdown {
  const unit = priceForPages(pages);
  const c = Math.min(MAX_COPIES, Math.max(1, Math.round(copies)));
  const goods = unit * c;
  return { unit, copies: c, goods, shipping: SHIPPING, total: goods + SHIPPING };
}

/** Format a whole-kroner amount as "649 kr". */
export function kr(amount: number): string {
  return `${amount.toLocaleString("nb-NO")} ${CURRENCY}`;
}
