import { api } from "./api";
import type { StockMovement } from "../types/stock";

export type StockPayload = {
  productId: number;
  quantity: number;
  note?: string;
};

export const getStockMovements = async (): Promise<StockMovement[]> => {
  const response = await api.get("/stock/movements");
  return response.data;
};

export const addStockEntry = async (payload: StockPayload) => {
  const response = await api.post("/stock/entry", payload);
  return response.data;
};

export const addStockOut = async (payload: StockPayload) => {
  const response = await api.post("/stock/out", payload);
  return response.data;
};