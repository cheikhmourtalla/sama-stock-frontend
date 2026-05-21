import { useEffect, useState } from "react";
import { getClientsList } from "../services/client.service";
import type { Client } from "../types/client";
import { Phone, User, Eye, Search } from "lucide-react";

export default function ClientsListPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    fetchClients();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchClients();
  };

  return (
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
              <button
                className="p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSelectedClient(client)}
              >
                <Eye size={18} />
              </button>
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
                <p className="font-bold text-red-600">{totalRemaining} FCFA</p>
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

                        <p className="text-red-600">Reste: {sale.remaining}</p>
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
  );
}
