import { api } from "./api";
import type { Product } from "../types/product";

export type CreateProductPayload = {
  name: string;
  description?: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  alertThreshold: number;
};

export type ProductQueryParams = {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type ProductListResponse = {
  // products(products: ProductListResponse): unknown;


  products: ProductListResponse;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export const getProducts = async (
  _p0?: string,
  _p1?: string,
  _p2?: number,
  _p3?: number,
  params?: ProductQueryParams,
): Promise<ProductListResponse> => {
  const response = await api.get("/products", { params });
  return response.data;
};

export const createProduct = async (
  payload: CreateProductPayload,
): Promise<Product> => {
  const response = await api.post("/products", payload);
  return response.data.product;
};

export const updateProduct = async (
  id: number,
  payload: CreateProductPayload,
): Promise<Product> => {
  const response = await api.put(`/products/${id}`, payload);
  return response.data.product;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};
