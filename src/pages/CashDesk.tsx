import { useEffect, useState } from "react";
import {
  Wallet,
  Lock,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Calendar,
} from "lucide-react";
import { api } from "../services/api";

export default function Cash() {
  const [session, setSession] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"caisse" | "historique">("caisse");

  // Modale d'ajout de mouvements
  const [showModal, setShowModal] = useState(false);
  const [mvtType, setMvtType] = useState("EXPENSE");
  const [mvtLabel, setMvtLabel] = useState("");
  const [mvtAmount, setMvtAmount] = useState("");
  const [mvtMethod, setMvtMethod] = useState("CASH");
  const [mvtNote, setMvtNote] = useState("");

  const fetchCurrentSession = async () => {
    try {
      const res = await api.get("/cash/current");
      setSession(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/cash/history");
      setHistory(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCurrentSession();
    fetchHistory();
  }, []);

  const openCash = async () => {
    if (!openingAmount) return alert("Veuillez entrer un montant initial.");
    try {
      await api.post("/cash/open", {
        userId: 1, // Devra être rendu dynamique basé sur l'authentification
        openingAmount: Number(openingAmount),
      });
      fetchCurrentSession();
      fetchHistory();
      setOpeningAmount(0);
    } catch (error: any) {
      alert(error.response?.data?.message || "Erreur lors de l'ouverture");
    }
  };

  const closeCash = async () => {
    if (
      window.confirm("Voulez-vous vraiment clôturer cette session de caisse ?")
    ) {
      try {
        await api.post("/cash/close");
        fetchCurrentSession();
        fetchHistory();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mvtLabel || !mvtAmount)
      return alert("Veuillez remplir les champs obligatoires.");

    try {
      await api.post("/cash/movement", {
        type: mvtType,
        label: mvtLabel,
        amount: Number(mvtAmount),
        paymentMethod: mvtMethod,
        note: mvtNote,
      });
      fetchCurrentSession();
      setShowModal(false);
      setMvtLabel("");
      setMvtAmount("");
      setMvtNote("");
    } catch (error: any) {
      alert(
        error.response?.data?.message || "Erreur lors de l'ajout du mouvement",
      );
    }
  };

  const totalEntries =
    session?.movements?.reduce((acc: number, movement: any) => {
      if (movement.type === "SALE" || movement.type === "CLIENT_PAYMENT") {
        return Number(acc + movement.amount);
      }
      return acc;
    }, 0) || 0;

  const totalOutputs =
    session?.movements?.reduce((acc: number, movement: any) => {
      if (movement.type === "SUPPLIER_PAYMENT" || movement.type === "EXPENSE") {
        return Number(acc + movement.amount);
      }
      return acc;
    }, 0) || 0;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans">
      {/* HEADER AVEC ONGLETS */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            SamaStock • Caisse
          </h1>
          <p className="text-slate-500 mt-1">
            Suivi financier, journal comptable de caisse et clôtures.
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("caisse")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === "caisse" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Wallet size={16} /> Session Actuelle
          </button>
          <button
            onClick={() => setActiveTab("historique")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === "historique" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            <History size={16} /> Journal des Clôtures
          </button>
        </div>
      </div>

      {activeTab === "caisse" ? (
        <>
          {/* SESSION DIRECTE */}
          {!session ? (
            <div className="bg-white p-8 rounded-3xl shadow-sm border max-w-md mx-auto text-center space-y-6 mt-12">
              <div className="mx-auto w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <Lock size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  La caisse est fermée
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Veuillez renseigner le montant initial du tiroir pour démarrer
                  la journée.
                </p>
              </div>
              <input
                type="number"
                placeholder="Ex: 25000 FCFA"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(Number(e.target.value))}
                className="w-full border rounded-2xl px-4 py-3.5 text-center text-xl font-bold focus:ring-2 focus:ring-green-500 outline-none"
              />
              <button
                onClick={openCash}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-semibold transition"
              >
                Ouvrir la caisse
              </button>
            </div>
          ) : (
            <>
              {/* STATS DE LA SESSION EN COURS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-3xl border border-blue-200 shadow-sm">
                  <p className="text-blue-600 font-semibold text-sm">
                    Solde actuel théorique
                  </p>
                  <h2 className="text-3xl font-black text-blue-900 mt-2">
                    {(
                      Number(session.openingAmount) +
                      totalEntries -
                      totalOutputs
                    ).toLocaleString()}{" "}
                    F{typeof session.openingAmount}
                  </h2>
                </div>
                <div className="bg-white p-5 rounded-3xl border shadow-sm">
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <ArrowUpRight size={16} className="text-green-500" />{" "}
                    Entrées
                  </p>
                  <h2 className="text-3xl font-bold text-green-600 mt-2">
                    {totalEntries.toLocaleString()} F
                  </h2>
                </div>
                <div className="bg-white p-5 rounded-3xl border shadow-sm">
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <ArrowDownLeft size={16} className="text-red-500" /> Sorties
                  </p>
                  <h2 className="text-3xl font-bold text-red-600 mt-2">
                    {totalOutputs.toLocaleString()} F
                  </h2>
                </div>
                <div className="bg-white p-5 rounded-3xl border shadow-sm">
                  <p className="text-slate-500 text-sm">Fond Ouverture</p>
                  <h2 className="text-2xl font-bold text-slate-700 mt-2">
                    {session.openingAmount.toLocaleString()} F
                  </h2>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium transition"
                >
                  <PlusCircle size={18} /> Nouveau mouvement
                </button>
                <button
                  onClick={closeCash}
                  className="ml-auto bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium transition"
                >
                  <Lock size={18} /> Fermer la caisse du jour
                </button>
              </div>

              {/* TABLEAU DES MOUVEMENTS DE LA SESSION */}
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-slate-800">
                    Mouvements de la session
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase border-b">
                        <th className="p-4">Heure</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Libellé</th>
                        <th className="p-4">Méthode</th>
                        <th className="p-4">Note</th>
                        <th className="p-4 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 text-sm">
                      {session.movements.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-400"
                          >
                            Aucun mouvement pour le moment.
                          </td>
                        </tr>
                      ) : (
                        session.movements.map((movement: any) => {
                          const isEntry = ["SALE", "CLIENT_PAYMENT"].includes(
                            movement.type,
                          );
                          return (
                            <tr
                              key={movement.id}
                              className="hover:bg-slate-50/50"
                            >
                              <td className="p-4 text-slate-400">
                                {new Date(
                                  movement.createdAt,
                                ).toLocaleTimeString()}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${isEntry ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                >
                                  {movement.type}
                                </span>
                              </td>
                              <td className="p-4 font-semibold text-slate-800">
                                {movement.label}
                              </td>
                              <td className="p-4 text-slate-500">
                                {movement.paymentMethod}
                              </td>
                              <td className="p-4 text-slate-400 max-w-xs truncate">
                                {movement.note || "---"}
                              </td>
                              <td
                                className={`p-4 text-right font-bold text-base ${isEntry ? "text-green-600" : "text-red-600"}`}
                              >
                                {isEntry ? "+" : "-"}{" "}
                                {movement.amount.toLocaleString()} F
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* ONGLET HISTORIQUE COMPTABLE (JOURNAL COMPTABLE JOURNALIER) */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-blue-500" /> Journal
              historique des sessions de caisse
            </h2>
            <div className="space-y-4">
              {history.filter((h) => !h.isOpen).length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  Aucun historique de clôture disponible.
                </p>
              ) : (
                history
                  .filter((h) => !h.isOpen)
                  .map((journal: any) => {
                    const mvtEntries = journal.movements
                      .filter((m: any) =>
                        ["SALE", "CLIENT_PAYMENT"].includes(m.type),
                      )
                      .reduce((a: number, b: any) => a + b.amount, 0);
                    const mvtOutputs = journal.movements
                      .filter((m: any) =>
                        ["SUPPLIER_PAYMENT", "EXPENSE"].includes(m.type),
                      )
                      .reduce((a: number, b: any) => a + b.amount, 0);
                    return (
                      <div
                        key={journal.id}
                        className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 grid grid-cols-2 md:grid-cols-5 gap-4 items-center"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">
                            Date
                          </p>
                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {new Date(journal.openedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Par : {journal.user?.name || "Caissier"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">
                            Fond d'ouverture
                          </p>
                          <p className="text-sm font-medium text-slate-600 mt-1">
                            {journal.openingAmount.toLocaleString()} F
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-green-500 uppercase">
                            Total Entrées (+)
                          </p>
                          <p className="text-sm font-semibold text-green-600 mt-1">
                            +{mvtEntries.toLocaleString()} F
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-red-500 uppercase">
                            Total Sorties (-)
                          </p>
                          <p className="text-sm font-semibold text-red-600 mt-1">
                            -{mvtOutputs.toLocaleString()} F
                          </p>
                        </div>
                        <div className="col-span-2 md:col-span-1 text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase">
                            Solde Final validé
                          </p>
                          <p className="text-lg font-black text-slate-900 mt-1">
                            {(journal.closingAmount || 0).toLocaleString()} F
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL POUR AJOUTER UN MOUVEMENT MANUEL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateMovement}
            className="bg-white p-6 rounded-3xl border max-w-md w-full space-y-4 shadow-xl"
          >
            <h3 className="text-xl font-bold text-slate-800">
              Ajouter une opération manuelle
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Type d'opération
              </label>
              <select
                value={mvtType}
                onChange={(e) => setMvtType(e.target.value)}
                className="w-full mt-1 border rounded-xl p-2.5 bg-slate-50 font-medium text-slate-700"
              >
                <option value="EXPENSE">Dépense (Sortie)</option>
                <option value="SUPPLIER_PAYMENT">
                  Règlement Fournisseur (Sortie)
                </option>
                <option value="CLIENT_PAYMENT">
                  Règlement Crédit Client (Entrée)
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Libellé / Titre de l'opération *
              </label>
              <input
                type="text"
                required
                value={mvtLabel}
                onChange={(e) => setMvtLabel(e.target.value)}
                className="w-full mt-1 border rounded-xl p-2.5 focus:ring-2 focus:ring-slate-800 outline-none"
                placeholder="Ex: Achat carburant moto, Encaissement Moussa"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Montant (FCFA) *
              </label>
              <input
                type="number"
                required
                value={mvtAmount}
                onChange={(e) => setMvtAmount(e.target.value)}
                className="w-full mt-1 border rounded-xl p-2.5 focus:ring-2 focus:ring-slate-800 outline-none font-bold"
                placeholder="Ex: 5000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Mode de paiement
              </label>
              <select
                value={mvtMethod}
                onChange={(e) => setMvtMethod(e.target.value)}
                className="w-full mt-1 border rounded-xl p-2.5 bg-slate-50 font-medium text-slate-700"
              >
                <option value="CASH">Espèces (Cash)</option>
                <option value="WAVE">Wave</option>
                <option value="ORANGE_MONEY">Orange Money</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Note additionnelle (Optionnel)
              </label>
              <input
                type="text"
                value={mvtNote}
                onChange={(e) => setMvtNote(e.target.value)}
                className="w-full mt-1 border rounded-xl p-2.5 focus:ring-2 focus:ring-slate-800 outline-none"
                placeholder="Ex: Facture d'électricité boutique Senelec"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-1/2 border py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-medium shadow-md"
              >
                Valider l'opération
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
