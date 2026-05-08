import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient,
  type ClientPayload,
} from "../services/client.service";
import { addSalePayment } from "../services/sale.service";
import type { Client } from "../types/client";
import { isAdmin } from "../utils/auth";

type ClientSale = {
  id: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  note?: string | null;
  createdAt: string;
  product?: {
    id: number;
    name: string;
  };
};

type ClientDetails = Client & {
  sales: ClientSale[];
  totalPurchases: number;
  totalPaid: number;
  totalRemaining: number;
};

const initialForm: ClientPayload = {
  name: "",
  phone: "",
};

export default function Clients() {
  const admin = isAdmin();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientPayload>(initialForm);
  const [search, setSearch] = useState("");

  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<ClientSale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Erreur clients", error);
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingClientId(null);
    setErrorMessage("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (client: Client) => {
    setForm({
      name: client.name,
      phone: client.phone,
    });
    setEditingClientId(client.id);
    setErrorMessage("");
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Voulez-vous vraiment supprimer ce client ?"
    );

    if (!confirmDelete) return;

    try {
      await deleteClient(id);
      toast.success("Client supprimé avec succès");
      await fetchClients();
    } catch (error: any) {
      console.error("Erreur suppression client", error);
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors de la suppression du client"
      );
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      setDetailsLoadingId(id);
      const data = await getClientById(id);
      setSelectedClient(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Erreur détails client", error);
      toast.error("Impossible de charger les détails du client");
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedClient(null);
  };

  const openPaymentModal = (sale: ClientSale) => {
    setSelectedSale(sale);
    setPaymentAmount("");
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setSelectedSale(null);
    setPaymentAmount("");
    setPaymentModalOpen(false);
  };

  const handleAddPayment = async () => {
    try {
      if (!selectedSale) return;

      const amount = Number(paymentAmount);

      if (!amount || amount <= 0) {
        toast.error("Veuillez saisir un montant valide");
        return;
      }

      setPaymentSubmitting(true);

      await addSalePayment(selectedSale.id, amount);

      toast.success("Paiement ajouté avec succès");

      if (selectedClient) {
        const refreshedClient = await getClientById(selectedClient.id);
        setSelectedClient(refreshedClient);
      }

      await fetchClients();

      closePaymentModal();
    } catch (error: any) {
      console.error("Erreur ajout paiement", error);
      toast.error(
        error?.response?.data?.message ||
          "Impossible d'ajouter le paiement"
      );
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      if (editingClientId !== null) {
        await updateClient(editingClientId, form);
        toast.success("Client modifié avec succès");
      } else {
        await createClient(form);
        toast.success("Client ajouté avec succès");
      }

      resetForm();
      setShowForm(false);
      await fetchClients();
    } catch (error: any) {
      console.error("Erreur formulaire client", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Impossible d'enregistrer le client."
      );
      toast.error("Erreur lors de l'enregistrement du client");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();

    return clients.filter((client) => {
      return (
        client.name.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q)
      );
    });
  }, [clients, search]);

  const totalDebt = useMemo(() => {
    return filteredClients.reduce(
      (sum, client) => sum + client.totalRemaining,
      0
    );
  }, [filteredClients]);

  const totalPaid = useMemo(() => {
    return filteredClients.reduce((sum, client) => sum + client.totalPaid, 0);
  }, [filteredClients]);

  const totalPurchases = useMemo(() => {
    return filteredClients.reduce(
      (sum, client) => sum + client.totalPurchases,
      0
    );
  }, [filteredClients]);

  const formatCurrency = (value: number) =>
    `${value.toLocaleString("fr-FR")} FCFA`;

  const getDebtStatus = (client: Client) => {
    if (client.totalRemaining > 0) {
      return {
        label: "Dette en cours",
        className: "bg-red-100 text-red-700",
      };
    }

    if (client.totalPurchases > 0 && client.totalRemaining === 0) {
      return {
        label: "Soldé",
        className: "bg-green-100 text-green-700",
      };
    }

    return {
      label: "Aucun achat",
      className: "bg-slate-100 text-slate-700",
    };
  };

  return (
    <section className="space-y-6">
  
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total achats</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalPurchases)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total payé</p>
          <h3 className="mt-2 text-2xl font-bold text-green-700">
            {formatCurrency(totalPaid)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Reste à payer</p>
          <h3 className="mt-2 text-2xl font-bold text-red-700">
            {formatCurrency(totalDebt)}
          </h3>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Liste des clients</h3>
            <p className="mt-1 text-sm text-gray-500">
              Consultez vos clients, leurs achats et leurs dettes.
            </p>
          </div>

          {admin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Ajouter client
            </button>
          )}
        </div>

        <div className="mt-6">
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {admin && showForm && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-slate-900">
            {editingClientId !== null ? "Modifier le client" : "Nouveau client"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nom du client
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="Ex: Mamadou Fall"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="Ex: 771234567"
                required
              />
            </div>

            {errorMessage && (
              <div className="md:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting
                  ? "Enregistrement..."
                  : editingClientId !== null
                  ? "Mettre à jour"
                  : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Réinitialiser
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="pb-3">Nom</th>
                    <th className="pb-3">Téléphone</th>
                    <th className="pb-3">Achats</th>
                    <th className="pb-3">Payé</th>
                    <th className="pb-3">Reste</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClients.map((client) => {
                    const status = getDebtStatus(client);

                    return (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 font-medium text-slate-900">
                          {client.name}
                        </td>
                        <td>{client.phone}</td>
                        <td>{formatCurrency(client.totalPurchases)}</td>
                        <td className="text-green-700">
                          {formatCurrency(client.totalPaid)}
                        </td>
                        <td className="font-semibold text-red-700">
                          {formatCurrency(client.totalRemaining)}
                        </td>
                        <td>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewDetails(client.id)}
                              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                            >
                              {detailsLoadingId === client.id
                                ? "Chargement..."
                                : "Détails"}
                            </button>

                            {admin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(client)}
                                  className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                                >
                                  Modifier
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(client.id)}
                                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                                >
                                  Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredClients.map((client) => {
                const status = getDebtStatus(client);

                return (
                  <div
                    key={client.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {client.name}
                        </h3>
                        <p className="text-sm text-gray-500">{client.phone}</p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Achats</p>
                        <p className="font-medium text-slate-900">
                          {formatCurrency(client.totalPurchases)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">Payé</p>
                        <p className="font-medium text-green-700">
                          {formatCurrency(client.totalPaid)}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-gray-400">Reste dû</p>
                        <p className="font-semibold text-red-700">
                          {formatCurrency(client.totalRemaining)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(client.id)}
                        className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                      >
                        {detailsLoadingId === client.id ? "Chargement..." : "Détails"}
                      </button>

                      {admin && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(client)}
                            className="flex-1 rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(client.id)}
                            className="flex-1 rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredClients.length === 0 && (
              <p className="mt-4 text-center text-gray-500">
                Aucun client trouvé
              </p>
            )}
          </>
        )}
      </div>

      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {selectedClient.name}
                </h3>
                <p className="text-sm text-gray-500">{selectedClient.phone}</p>
              </div>

              <button
                onClick={closeDetailsModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Total achats</p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatCurrency(selectedClient.totalPurchases)}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-gray-500">Total payé</p>
                <p className="mt-2 text-xl font-bold text-green-700">
                  {formatCurrency(selectedClient.totalPaid)}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-sm text-gray-500">Reste à payer</p>
                <p className="mt-2 text-xl font-bold text-red-700">
                  {formatCurrency(selectedClient.totalRemaining)}
                </p>
              </div>
            </div>

            <h4 className="mb-4 text-lg font-semibold text-slate-900">
              Historique des achats
            </h4>

            {selectedClient.sales.length === 0 ? (
              <p className="text-gray-500">Aucun achat trouvé pour ce client.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="pb-3">Produit</th>
                      <th className="pb-3">Quantité</th>
                      <th className="pb-3">Prix unitaire</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Payé</th>
                      <th className="pb-3">Reste</th>
                      <th className="pb-3">Note</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClient.sales.map((sale) => (
                      <tr key={sale.id} className="border-b">
                        <td className="py-3 font-medium text-slate-900">
                          {sale.product?.name || "-"}
                        </td>
                        <td>{sale.quantity}</td>
                        <td>{formatCurrency(sale.unitPrice)}</td>
                        <td>{formatCurrency(sale.totalAmount)}</td>
                        <td className="text-green-700">
                          {formatCurrency(sale.paidAmount)}
                        </td>
                        <td className="font-semibold text-red-700">
                          {formatCurrency(sale.remaining)}
                        </td>
                        <td>{sale.note || "-"}</td>
                        <td>{new Date(sale.createdAt).toLocaleString()}</td>
                        <td>
                          {sale.remaining > 0 ? (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(sale)}
                              className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                            >
                              Ajouter paiement
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">Soldée</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {paymentModalOpen && selectedSale && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Ajouter un paiement
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Produit : {selectedSale.product?.name || "-"}
              </p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-medium">
                  {formatCurrency(selectedSale.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Déjà payé</span>
                <span className="font-medium text-green-700">
                  {formatCurrency(selectedSale.paidAmount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Reste à payer</span>
                <span className="font-semibold text-red-700">
                  {formatCurrency(selectedSale.remaining)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Montant à ajouter
              </label>
              <input
                type="number"
                min={1}
                max={selectedSale.remaining}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="Ex: 100000"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddPayment}
                disabled={paymentSubmitting}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {paymentSubmitting ? "Enregistrement..." : "Valider"}
              </button>

              <button
                type="button"
                onClick={closePaymentModal}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}