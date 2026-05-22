import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  X,
  UserPlus,
  Users,
  // AlertTriangle,
  Wallet,
  User,
  Phone,
  Eye,
} from "lucide-react";
import {
  createClient,
  deleteClient,
  getClients,
  getClientsList,
  updateClient,
  type ClientPayload,
} from "../services/client.service";

import type { Client } from "../types/client";
// import { isAdmin } from "../utils/auth";

// type ClientSale = {
//   id: number;
//   quantity: number;
//   unitPrice: number;
//   totalAmount: number;
//   paidAmount: number;
//   remaining: number;
//   note?: string | null;
//   createdAt: string;
//   product?: {
//     id: number;
//     name: string;
//   };
// };
const initialForm: ClientPayload = {
  name: "",
  phone: "",
};

export default function Clients() {
  // const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClientPayload>(initialForm);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const totalSales = selectedClient?.sales?.length || 0;

  const totalAmount = selectedClient?.sales?.reduce(
    (sum, s) => sum + Number(s.totalAmount || 0),
    0,
  );

  const totalPaid = selectedClient?.sales?.reduce(
    (sum, s) => sum + Number(s.paidAmount || 0),
    0,
  );

  const totalRemaining = selectedClient?.sales?.reduce(
    (sum, s) => sum + Number(s.remaining || 0),
    0,
  );

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await getClientsList(page, limit, search);

      setClients(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
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
  const handleSearch = () => {
    setPage(1);
    fetchClients();
  };
  useEffect(() => {
    fetchClients();
    fetchData();
  }, [page]);

  const stats = useMemo(() => {
    const debtClients = clients.filter(
      (c: any) => (c.totalRemaining || 0) > 0,
    ).length;

    const totalDebt = clients.reduce(
      (acc: number, c: any) => acc + (c.totalRemaining || 0),
      0,
    );

    return {
      total: clients.length,
      debtClients,
      totalDebt,
    };
  }, [clients]);

  const handleOpenCreate = () => {
    setFormData(initialForm);

    setIsEditing(false);

    setEditId(null);

    setErrorMessage("");

    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const msg = error.response?.data?.message || "Erreur serveur";

      setErrorMessage(msg);

      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    if (!window.confirm("Supprimer ce client ?")) return;

    try {
      await deleteClient(id);

      toast.success("Client supprimé");

      if (selectedClient?.id === id) setSelectedClient(null);

      fetchData();
    } catch (error) {
      toast.error("Suppression impossible");
    }
  };

  const formatCurrency = (v: number) => `${v.toLocaleString()} FCFA`;

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Clients
          </h1>

          <p className="text-slate-500 mt-1">
            Gestion des clients, dettes et règlements.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-xl text-white">
            <Users size={20} />
          </div>

          <div>
            <p className="text-xs font-bold text-blue-600 uppercase">Clients</p>

            <p className="text-xl font-black text-blue-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-rose-500 p-3 rounded-xl text-white">
            <Wallet size={20} />
          </div>

          <div>
            <p className="text-xs font-bold text-rose-600 uppercase">Dettes</p>

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
              onChange={(e) => setSearch(e.target.value)}
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

      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Liste des clients</h1>

        {/* SEARCH */}
        <div className="flex gap-2">
          <div className="flex items-center border rounded-lg px-2 w-full">
            <Search size={16} className="text-gray-400" />
            <input
              className="p-2 w-full outline-none"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={handleSearch}
            className="bg-black text-white px-4 rounded-lg"
          >
            OK
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="p-6">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="text-gray-500">Aucun client trouvé</div>
        ) : (
          <div className="grid gap-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white p-4 rounded-xl border flex justify-between items-center"
              >
                {/* INFO CLIENT */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={18} />
                  </div>

                  <div>
                    <p className="font-semibold">{client.name}</p>

                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone size={14} />
                      {client.phone}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2">
                  {/* VIEW */}
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setSelectedClient(client)}
                  >
                    <Eye size={18} />
                  </button>

                  {/* EDIT */}
                  <button
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                    onClick={() => {
                      setFormData({
                        name: client.name,
                        phone: client.phone,
                      });
                      setIsEditing(true);
                      setEditId(client.id);
                      setShowForm(true);
                      setErrorMessage("");
                    }}
                  >
                    ✏️
                  </button>

                  {/* DELETE */}
                  <button
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    onClick={(e) => handleDelete(e, client.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            Page {meta.page} / {meta.totalPages} — {meta.total} clients
          </p>

          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {selectedClient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-2xl rounded-xl p-6 space-y-5 relative">
              {/* CLOSE */}
              <button
                className="absolute top-3 right-3 text-gray-500"
                onClick={() => setSelectedClient(null)}
              >
                ✕
              </button>

              {/* HEADER CLIENT */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">{selectedClient.name}</h2>
                    <p className="text-sm text-gray-500">
                      📞 {selectedClient.phone}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm">
                  <p className="text-gray-500">Client depuis</p>
                  <p className="font-semibold">
                    {new Date(selectedClient.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-500">Ventes</p>
                  <p className="font-bold">{totalSales}</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold">{totalAmount} FCFA</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-500">Payé</p>
                  <p className="font-bold text-green-600">{totalPaid} FCFA</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-500">Restant</p>
                  <p className="font-bold text-red-600">
                    {totalRemaining} FCFA
                  </p>
                </div>
              </div>

              {/* SALES LIST */}
              <div>
                <h3 className="font-semibold mb-2">Historique des ventes</h3>

                {selectedClient.sales?.length ? (
                  <div className="space-y-2 max-h-72 overflow-auto">
                    {selectedClient.sales.map((sale) => (
                      <div
                        key={sale.id}
                        className="border rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold">Vente #{sale.id}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right text-sm">
                          <p>
                            Total: <b>{sale.totalAmount} FCFA</b>
                          </p>

                          <p className="text-green-600">
                            Payé: {sale.paidAmount}
                          </p>

                          <p className="text-red-600">
                            Reste: {sale.remaining}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Aucune vente enregistrée
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
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
              {isEditing ? "Modifier Client" : "Nouveau Client"}
            </h2>

            {errorMessage && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                {submitting ? "Enregistrement..." : "Confirmer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
