import { api } from "./api";

export const getSales = async (page = 1, limit = 20) => {
  const response = await api.get(`/sales?page=${page}&limit=${limit}`);

  return response.data.data;
};

export const getSalesStats = async () => {
  const res = await api.get("/sales/stats");

  console.log(res.data);

  return res.data;
};
export const getSaleById = async (id: number) => {
  const response = await api.get(`/sales/${id}`);
  return response.data.data;
};

export const createSale = async (payload: any) => {
  const response = await api.post("/sales", payload);
  return response.data.data;
};

export const updateSale = async (id: number, payload: any) => {
  const response = await api.put(`/sales/${id}`, payload);
  return response.data.data;
};

export const deleteSale = async (id: number) => {
  const response = await api.delete(`/sales/${id}`);
  return response.data.data;
};

export const addSalePayment = async (
  saleId: number,
  amount: number,
  paymentMethod: string = "CASH",
) => {
  const response = await api.patch(`/sales/${saleId}/payment`, {
    amount,
    paymentMethod,
  });
  return response.data.data;
};
