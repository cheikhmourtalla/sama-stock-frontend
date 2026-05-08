import { api } from "./api";
import type { Client } from "../types/client";

export type ClientPayload = {
  name: string;
  phone: string;
};

export const getClients = async (): Promise<Client[]> => {
  const response = await api.get("/clients");
  return response.data;
};

export const getClientById = async (id: number) => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (
  payload: ClientPayload
): Promise<Client> => {
  const response = await api.post("/clients", payload);
  return response.data.client;
};

export const updateClient = async (
  id: number,
  payload: ClientPayload
): Promise<Client> => {
  const response = await api.put(`/clients/${id}`, payload);
  return response.data.client;
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/clients/${id}`);
};