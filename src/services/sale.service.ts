import { api } from "./api";

export const getSales = async () => {
  const response = await api.get("/sales");
  return response.data;
};

export const getSaleById = async (id: number) => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (payload: any) => {
  const response = await api.post("/sales", payload);
  return response.data;
};

export const updateSale = async (id: number, payload: any) => {
  const response = await api.put(`/sales/${id}`, payload);
  return response.data;
};

export const deleteSale = async (id: number) => {
  const response = await api.delete(`/sales/${id}`);
  return response.data;
};

export const addSalePayment = async (saleId: number, amount: number) => {
  const response = await api.patch(`/sales/${saleId}/payment`, { amount });
  return response.data;
};