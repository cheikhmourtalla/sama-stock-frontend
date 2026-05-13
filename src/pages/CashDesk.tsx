import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Search,
  X,
} from "lucide-react";
import { api } from "../services/api";

type Transaction = {
  id: number;
  type: "ENTRY" | "EXIT";
  label: string;
  amount: number;
  paymentMethod: "WAVE" | "ORANGE_MONEY" | "CASH";
  createdAt: string;
};

type CashSummary = {
  balance: number;
  entries: number;
  exits: number;
  transactions: number;
};

export default function CashDesk() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<CashSummary>({
    balance: 0,
    entries: 0,
    exits: 0,
    transactions: 0,
  });

  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: "ENTRY",
    label: "",
    amount: "",
    paymentMethod: "CASH",
  });

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/cash");

      setTransactions(res.data.transactions);

      setSummary(res.data.summary);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [transactions, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/cash", {
        ...formData,
        amount: Number(formData.amount),
      });

      setFormData({
        type: "ENTRY",
        label: "",
        amount: "",
        paymentMethod: "CASH",
      });

      setIsModalOpen(false);

      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  const closeCashDay = async () => {
    if (!window.confirm("Fermer la caisse du jour ?")) return;

    try {
      await api.post("/cash/close-day");

      alert("Caisse journalière fermée avec succès");

      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Caisse
            </h1>

            <p className="text-slate-500 mt-1">
              Gérez les entrées et sorties d’argent.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={closeCashDay}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl"
            >
              Fermer la caisse
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
            >
              <Plus size={18} />
              Nouvelle opération
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-5 border shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">
                Solde actuel
              </p>

              <h2 className="text-3xl font-bold text-slate-800 mt-2">
                {summary.balance.toLocaleString()} FCFA
              </h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Wallet className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">
                Entrées
              </p>

              <h2 className="text-3xl font-bold text-green-600 mt-2">
                +{summary.entries.toLocaleString()} FCFA
              </h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
              <ArrowDownCircle
                className="text-green-600"
                size={28}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">
                Sorties
              </p>

              <h2 className="text-3xl font-bold text-red-600 mt-2">
                -{summary.exits.toLocaleString()} FCFA
              </h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <ArrowUpCircle
                className="text-red-600"
                size={28}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">
                Transactions
              </p>

              <h2 className="text-3xl font-bold text-slate-800 mt-2">
                {summary.transactions}
              </h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Wallet className="text-slate-700" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Historique des opérations
              </h2>

              <p className="text-slate-500 mt-1">
                Toutes les opérations financières.
              </p>
            </div>

            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Rechercher une opération..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="p-4">Type</th>
                <th className="p-4">Description</th>
                <th className="p-4">Paiement</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="p-4">
                    {transaction.type === "ENTRY" ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        Entrée
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                        Sortie
                      </span>
                    )}
                  </td>

                  <td className="p-4 font-medium text-slate-700">
                    {transaction.label}
                  </td>

                  <td className="p-4">
                    {transaction.paymentMethod === "WAVE"
                      ? "Wave"
                      : transaction.paymentMethod ===
                        "ORANGE_MONEY"
                      ? "Orange Money"
                      : "Espèces"}
                  </td>

                  <td
                    className={`p-4 font-bold ${
                      transaction.type === "ENTRY"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "ENTRY" ? "+" : "-"}
                    {transaction.amount.toLocaleString()} FCFA
                  </td>

                  <td className="p-4 text-slate-500">
                    {new Date(
                      transaction.createdAt
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center p-10 text-slate-500"
                  >
                    Aucune transaction trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Nouvelle opération
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Type
                </label>

                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                    })
                  }
                  className="w-full border rounded-2xl px-4 py-3 outline-none"
                >
                  <option value="ENTRY">Entrée</option>
                  <option value="EXIT">Sortie</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Description
                </label>

                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      label: e.target.value,
                    })
                  }
                  className="w-full border rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Montant
                </label>

                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: e.target.value,
                    })
                  }
                  className="w-full border rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Méthode de paiement
                </label>

                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full border rounded-2xl px-4 py-3 outline-none"
                >
                  <option value="CASH">Espèces</option>
                  <option value="WAVE">Wave</option>
                  <option value="ORANGE_MONEY">
                    Orange Money
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}