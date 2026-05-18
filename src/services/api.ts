import axios from "axios";

export const api = axios.create({
  baseURL: `https://sama-stock.onrender.com/api`,
  // baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
