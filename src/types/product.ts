export type Product = {
  id: number;
  name: string;
  description?: string | null;
  category: string;
  reference: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  alertThreshold: number;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
};