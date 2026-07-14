import type { OrderStatus } from "@/lib/schemas/common";

/**
 * PrintProvider — the swappable seam for print-on-demand fulfillment.
 * MVP ships "Download print-ready PDF"; "Order hardcover" rides this behind a
 * feature flag. A `gelato` implementation is stubbed (catalog, quote, order).
 */

export interface PrintCatalogItem {
  sku: string;
  name: string;
  /** e.g. "20x25" cm. */
  trimSize: string;
  minPages: number;
  maxPages: number;
  hardcover: boolean;
}

export interface PrintQuoteRequest {
  sku: string;
  pageCount: number;
  quantity: number;
  destinationCountry: string;
}

export interface PrintQuote {
  sku: string;
  currency: string;
  /** Unit price in minor units (e.g. cents). */
  unitPriceMinor: number;
  shippingMinor: number;
  totalMinor: number;
  estimatedDeliveryDays: number | null;
}

export interface PrintOrderRequest {
  sku: string;
  pdfUrl: string;
  pageCount: number;
  quantity: number;
  recipientName: string;
  recipientAddress: string;
  giftNote: string | null;
}

export interface PrintOrderResult {
  providerOrderId: string;
  status: OrderStatus;
}

export interface PrintProvider {
  readonly id: string;
  getCatalog(): Promise<PrintCatalogItem[]>;
  getQuote(req: PrintQuoteRequest): Promise<PrintQuote>;
  submitOrder(req: PrintOrderRequest): Promise<PrintOrderResult>;
  healthCheck(): Promise<boolean>;
}

/**
 * Gelato stub. Shapes are realistic so the order flow can be built against
 * this seam, but nothing is submitted — every order returns a synthetic id in
 * "draft". Live ordering is explicitly out of MVP.
 */
export class GelatoPrintProvider implements PrintProvider {
  readonly id = "gelato";

  async getCatalog(): Promise<PrintCatalogItem[]> {
    return [
      {
        sku: "arv-hardcover-20x25",
        name: "Arv Hardcover 20×25 cm",
        trimSize: "20x25",
        minPages: 24,
        maxPages: 200,
        hardcover: true,
      },
    ];
  }

  async getQuote(req: PrintQuoteRequest): Promise<PrintQuote> {
    // Placeholder pricing model until the live catalog is wired.
    const base = 2900;
    const perPage = 15;
    const unit = base + perPage * req.pageCount;
    return {
      sku: req.sku,
      currency: "EUR",
      unitPriceMinor: unit,
      shippingMinor: 799,
      totalMinor: unit * req.quantity + 799,
      estimatedDeliveryDays: null,
    };
  }

  async submitOrder(): Promise<PrintOrderResult> {
    // Stubbed: never actually submits. Live fulfillment is out of MVP.
    return {
      providerOrderId: `stub_${"x".repeat(8)}`,
      status: "draft",
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export function getPrintProvider(): PrintProvider {
  switch (process.env.PRINT_PROVIDER) {
    case "gelato":
    default:
      return new GelatoPrintProvider();
  }
}
