import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Phone,
  User,
  CreditCard,
  History,
  ChevronRight,
  Trash2,
  Edit,
  X,
  UserPlus,
  TrendingUp,
  Users,
  // AlertTriangle,
  Wallet,
} from "lucide-react";

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

  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [selectedSale, setSelectedSale] =
    useState<ClientSale | null>(null);

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentSubmitting, setPaymentSubmitting] =
    useState(false);

  const [selectedClient, setSelectedClient] =
    useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);

  const [editId, setEditId] = useState<number | null>(
    null
  );

  const [formData, setFormData] =
    useState<ClientPayload>(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);

      const data = await getClients();

      setClients(data);
    } catch (error) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const debtClients = clients.filter(
      (c: any) => (c.totalRemaining || 0) > 0
    ).length;

    const totalDebt = clients.reduce(
      (acc: number, c: any) =>
        acc + (c.totalRemaining || 0),
      0
    );

    return {
      total: clients.length,
      debtClients,
      totalDebt,
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(
      (c) =>
        c.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );
  }, [clients, search]);

  const handleSelectClient = async (
    id: number
  ) => {
    try {
      const details = await getClientById(id);

      setSelectedClient(details);
    } catch (error) {
      toast.error("Erreur détails client");
    }
  };

  const openPaymentModal = (sale: ClientSale) => {
    setSelectedSale(sale);

    setPaymentAmount(sale.remaining.toString());

    setShowPaymentModal(true);
  };

  const handleAddPayment = async () => {
    if (
      !selectedSale ||
      !paymentAmount ||
      Number(paymentAmount) <= 0
    )
      return;

    setPaymentSubmitting(true);

    try {
      await addSalePayment(
        selectedSale.id,
        Number(paymentAmount)
      );

      toast.success("Versement enregistré");

      setShowPaymentModal(false);

      if (selectedClient)
        handleSelectClient(selectedClient.id);

      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du versement"
      );
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData(initialForm);

    setIsEditing(false);

    setEditId(null);

    setErrorMessage("");

    setShowForm(true);
  };

  const handleOpenEdit = (
    e: React.MouseEvent,
    client: Client
  ) => {
    e.stopPropagation();

    setFormData({
      name: client.name,
      phone: client.phone,
    });

    setIsEditing(true);

    setEditId(client.id);

    setErrorMessage("");

    setShowForm(true);
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSubmitting(true);

    setErrorMessage("");

    try {
      if (isEditing && editId) {
        await updateClient(editId, formData);

        toast.success("Client mis à jour");
      } else {
        await createClient(formData);

        toast.success("Client ajouté");
      }

      setShowForm(false);

      fetchData();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Erreur serveur";

      setErrorMessage(msg);

      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: number
  ) => {
    e.stopPropagation();

    if (!window.confirm("Supprimer ce client ?"))
      return;

    try {
      await deleteClient(id);

      toast.success("Client supprimé");

      if (selectedClient?.id === id)
        setSelectedClient(null);

      fetchData();
    } catch (error) {
      toast.error("Suppression impossible");
    }
  };

  const formatCurrency = (v: number) =>
    `${v.toLocaleString()} FCFA`;

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        <div className="lg:col-span-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Clients
          </h1>

          <p className="text-slate-500 mt-1">
            Gestion des clients, dettes et
            règlements.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">

          <div className="bg-blue-500 p-3 rounded-xl text-white">
            <Users size={20} />
          </div>

          <div>
            <p className="text-xs font-bold text-blue-600 uppercase">
              Clients
            </p>

            <p className="text-xl font-black text-blue-900">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">

          <div className="bg-rose-500 p-3 rounded-xl text-white">
            <Wallet size={20} />
          </div>

          <div>
            <p className="text-xs font-bold text-rose-600 uppercase">
              Dettes
            </p>

            <p className="text-xl font-black text-rose-900">
              {formatCurrency(stats.totalDebt)}
            </p>
          </div>
        </div>
      </div>

      {/* TOP BAR */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-4 font-bold flex items-center justify-center gap-2 transition-all"
          >
            <UserPlus size={18} />
            Nouveau Client
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* CLIENTS */}
        <div className="xl:col-span-5 space-y-4">

          {loading ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center">
              <p className="text-slate-500">
                Chargement...
              </p>
            </div>
          ) : (
            <>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() =>
                    handleSelectClient(client.id)
                  }
                  className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedClient?.id === client.id
                      ? "border-slate-900 ring-1 ring-slate-900 shadow-md"
                      : "border-transparent shadow-sm hover:border-slate-200"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-700 uppercase">
                      {client.name.substring(0, 2)}
                    </div>

                    <div>
                      <p className="font-black text-slate-900">
                        {client.name}
                      </p>

                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <Phone size={14} />
                        {client.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">

                    <button
                      onClick={(e) =>
                        handleOpenEdit(e, client)
                      }
                      className="p-2 text-slate-400 hover:text-blue-600"
                    >
                      <Edit size={18} />
                    </button>

                    {admin && (
                      <button
                        onClick={(e) =>
                          handleDelete(
                            e,
                            client.id
                          )
                        }
                        className="p-2 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}

                    <ChevronRight
                      size={20}
                      className="text-slate-300"
                    />
                  </div>
                </div>
              ))}

              {filteredClients.length === 0 && (
                <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center">
                  <p className="text-slate-500">
                    Aucun client trouvé.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* DETAILS */}
        <div className="xl:col-span-7">

          {selectedClient ? (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 sticky top-8 space-y-8">

              <div className="flex justify-between items-start">

                <div className="p-4 bg-slate-900 rounded-2xl text-white">
                  <User size={32} />
                </div>

                <div className="text-right">
                  <h2 className="text-3xl font-black text-slate-900">
                    {selectedClient.name}
                  </h2>

                  <p className="text-slate-500 font-medium mt-1">
                    {selectedClient.phone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="bg-slate-50 p-6 rounded-3xl">

                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Achats
                  </p>

                  <p className="text-2xl font-black text-slate-900 mt-2">
                    {formatCurrency(
                      selectedClient.totalPurchases ||
                        0
                    )}
                  </p>
                </div>

                <div
                  className={`p-6 rounded-3xl ${
                    selectedClient.totalRemaining >
                    0
                      ? "bg-rose-50 text-rose-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >

                  <p className="text-xs font-black uppercase tracking-widest opacity-60">
                    Dette restante
                  </p>

                  <p className="text-2xl font-black mt-2">
                    {formatCurrency(
                      selectedClient.totalRemaining ||
                        0
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <h4 className="font-black text-slate-900 flex items-center gap-2">
                  <History
                    size={18}
                    className="text-slate-400"
                  />
                  Factures
                </h4>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">

                  {selectedClient.sales?.map(
                    (sale: ClientSale) => (
                      <div
                        key={sale.id}
                        className="p-5 rounded-3xl border border-slate-100 bg-slate-50"
                      >

                        <div className="flex justify-between items-start">

                          <div>
                            <p className="font-black text-slate-900">
                              {sale.product?.name ||
                                "Achat"}
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(
                                sale.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="text-right">

                            <p className="font-black text-slate-900">
                              {formatCurrency(
                                sale.totalAmount
                              )}
                            </p>

                            <p
                              className={`text-xs font-black uppercase mt-1 ${
                                sale.remaining > 0
                                  ? "text-rose-500"
                                  : "text-emerald-500"
                              }`}
                            >
                              {sale.remaining > 0
                                ? `Reste : ${formatCurrency(
                                    sale.remaining
                                  )}`
                                : "Soldé"}
                            </p>
                          </div>
                        </div>

                        {sale.remaining > 0 && (
                          <button
                            onClick={() =>
                              openPaymentModal(
                                sale
                              )
                            }
                            className="mt-5 w-full py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard
                              size={16}
                            />
                            Ajouter un versement
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white">

              <TrendingUp
                size={52}
                className="mb-5 opacity-20"
              />

              <p className="font-black text-slate-500 text-lg">
                Sélectionnez un client
              </p>

              <p className="text-slate-400 mt-2">
                Les détails et factures
                apparaîtront ici.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CLIENT */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">

            <button
              onClick={() => setShowForm(false)}
              className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black text-slate-900 mb-8">

              {isEditing
                ? "Modifier Client"
                : "Nouveau Client"}
            </h2>

            {errorMessage && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100">
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              <div className="space-y-2">

                <label className="text-sm font-semibold text-slate-700">
                  Nom complet
                </label>

                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-2">

                <label className="text-sm font-semibold text-slate-700">
                  Téléphone
                </label>

                <input
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {submitting
                  ? "Enregistrement..."
                  : "Confirmer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">

            <button
              onClick={() =>
                setShowPaymentModal(false)
              }
              className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black text-slate-900 mb-2">
              Versement
            </h2>

            <p className="text-slate-500 mb-8">
              Réduction de la dette
            </p>

            <div className="space-y-6">

              <div className="space-y-2">

                <label className="text-sm font-semibold text-slate-700">
                  Montant
                </label>

                <input
                  type="number"
                  min={1}
                  max={selectedSale.remaining}
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-slate-900 font-black text-lg"
                />
              </div>

              <button
                onClick={handleAddPayment}
                disabled={paymentSubmitting}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {paymentSubmitting
                  ? "Validation..."
                  : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}