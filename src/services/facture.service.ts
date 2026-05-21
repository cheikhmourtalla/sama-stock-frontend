import { api } from "./api";
export interface Facture {
  id: number;
  numero: number;

  statut: "REGLEE" | "NON_REGLEE" | "PARTIELLEMENT_REGLEE";

  total: number;
  montantVerse: number;
  resteDu: number;

  dateFacture: string;

  clientNom: string;
  clientTelephone?: string;

  sale: {
    id: number;
  };

  lignes: any[];
}

export const factureService = {
  async getFactures(page = 1, limit = 10, search = "") {
    const response = await api.get("sales/factures", {
      params: {
        page,
        limit,
        search,
      },
    });

    return response.data;
  },

  async getFacture(id: number) {
    const response = await api.get(`sales/facture/${id}`);

    return response.data;
  },

  async getLastFacture() {
    const response = await api.get("sales/last-facture");

    return response.data;
  },

  async addPayment(
    id: number,
    payload: {
      amount: number;
      paymentMethod: string;
    },
  ) {
    const response = await api.post(`sales/facture/${id}/payment`, payload);

    return response.data;
  },
};
