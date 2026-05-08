import { api } from "./api";
import type { DashboardStats } from "../types/dashboard";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};