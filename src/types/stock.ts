import type { Product } from "./product";

export type StockMovement = {
  id: number;
  productId: number;
  type: "ENTRY" | "OUT" | "SALE";
  quantity: number;
  note?: string | null;
  createdAt: string;
  product: Product;
};