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
export type UpdateProductPayload = {
  name?: string;
  description?: string;
  quantity?: number;
  purchasePrice?: number;
  salePrice?: number;
  alertThreshold?: number;
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

export const getProducts = async (page: number, limit: number) => {
  const response = await api.get(`/products?page=${page}&limit=${limit}`);

  return response.data;
};

//  used fo
export const allProducts = async () => {
  const response = await api.get(`/products/all/products`);

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
  payload: UpdateProductPayload,
): Promise<Product> => {
  const isObject =
    typeof payload === "object" && payload !== null && !Array.isArray(payload);

  const updatePayload = isObject ? payload : { quantity: payload };

  console.log(updatePayload);
  const response = await api.patch(`/products/${id}`, updatePayload);
  return response.data.product;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};
