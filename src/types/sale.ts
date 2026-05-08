export type Sale = {
  id: number;
  productId: number;
  clientId?: number | null;

  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  remaining: number;

  customer?: string | null;
  note?: string | null;
  createdAt: string;

  product?: {
    id: number;
    name: string;
    category?: string;
    reference?: string;
  };

  client?: {
    id: number;
    name: string;
    phone: string;
  };
};