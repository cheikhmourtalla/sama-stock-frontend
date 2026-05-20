import { useEffect, useState } from "react";
import {
  Wallet,
  Lock,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Calendar,
  Printer,
  Activity,
  AlertCircle,
  X,
  User,
  Clock,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { getStoredUser } from "../utils/auth";

export default function Cash() {
  const currentUser = getStoredUser();
  const [session, setSession] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [openingAmount, setOpeningAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"caisse" | "historique">("caisse");

  // Modale d'ajout de mouvements
  const [showModal, setShowModal] = useState(false);
  const [opType, setOpType] = useState<"ENTREE" | "SORTIE">("ENTREE");
  const [opCategory, setOpCategory] = useState("Vente");
  const [mvtLabel, setMvtLabel] = useState("");
  const [mvtAmount, setMvtAmount] = useState("");
  const [mvtMethod, setMvtMethod] = useState("CASH");
  const [mvtNote, setMvtNote] = useState("");
  const [submittingMovement, setSubmittingMovement] = useState(false);

  // Modale de confirmation de clôture
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingSubmitting, setClosingSubmitting] = useState(false);

  // Modale d'ouverture de caisse loading
  const [openingSubmitting, setOpeningSubmitting] = useState(false);

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

  // Update category dropdown default selection when type changes
  useEffect(() => {
    if (opType === "ENTREE") {
      setOpCategory("Vente");
    } else {
      setOpCategory("Paiement fournisseur");
    }
  }, [opType]);

  const openCash = async () => {
    const amount = Number(openingAmount);
    if (!openingAmount || isNaN(amount) || amount < 0) {
      toast.error("Veuillez entrer un montant initial valide.");
      return;
    }

    setOpeningSubmitting(true);
    try {
      await api.post("/cash/open", {
        userId: currentUser?.id || 1,
        openingAmount: amount,
      });
      toast.success("Caisse ouverte avec succès !");
      await fetchCurrentSession();
      await fetchHistory();
      setOpeningAmount("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'ouverture",
      );
    } finally {
      setOpeningSubmitting(false);
    }
  };

  const closeCash = async () => {
    setClosingSubmitting(true);
    try {
      const res = await api.post("/cash/close");
      toast.success("Caisse clôturée avec succès !");
      setShowCloseModal(false);

      const closedSessionData = res.data?.data;
      if (closedSessionData) {
        // Automatically ask to print report
        if (
          window.confirm(
            "La caisse est clôturée. Voulez-vous imprimer le rapport journalier maintenant ?",
          )
        ) {
          // Fetch full session details with movements to print
          const fullSessionRes = await api.get(`/cash/history`);
          const endedSession = fullSessionRes.data.find(
            (s: any) => s.id === closedSessionData.id,
          );
          if (endedSession) {
            handlePrintReport(endedSession);
          }
        }
      }

      await fetchCurrentSession();
      await fetchHistory();
      // Navigate back to dashboard after closing
      // navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la clôture");
    } finally {
      setClosingSubmitting(false);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(mvtAmount);
    if (!mvtLabel) {
      toast.error("Veuillez entrer un libellé.");
      return;
    }
    if (!mvtAmount || isNaN(amount) || amount <= 0) {
      toast.error("Veuillez entrer un montant valide supérieur à 0.");
      return;
    }

    setSubmittingMovement(true);

    // Map frontend categories and type to database model structure
    let dbType = "EXPENSE";
    if (opType === "ENTREE") {
      if (opCategory === "Paiement dette client") {
        dbType = "CLIENT_PAYMENT";
      } else {
        dbType = "SALE";
      }
    } else {
      if (opCategory === "Paiement fournisseur") {
        dbType = "SUPPLIER_PAYMENT";
      } else {
        dbType = "EXPENSE";
      }
    }

    try {
      await api.post("/cash/movement", {
        type: dbType,
        label: `${opCategory}: ${mvtLabel}`,
        amount: amount,
        paymentMethod: mvtMethod,
        note: mvtNote || undefined,
      });

      toast.success("Opération enregistrée avec succès !");
      await fetchCurrentSession();
      setShowModal(false);
      setMvtLabel("");
      setMvtAmount("");
      setMvtNote("");
      setMvtMethod("CASH");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors du mouvement");
    } finally {
      setSubmittingMovement(false);
    }
  };

  const handlePrintReport = (sessionData: any) => {
    const formattedDate = new Date(sessionData.openedAt).toLocaleDateString(
      "fr-FR",
    );
    const openedTime = new Date(sessionData.openedAt).toLocaleTimeString(
      "fr-FR",
      { hour: "2-digit", minute: "2-digit" },
    );
    const closedTime = sessionData.closedAt
      ? new Date(sessionData.closedAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "En cours";
    const user = sessionData.user?.name || "Caissier";

    // Calculate entries & exits
    const movements = sessionData.movements || [];
    const mvtEntries = movements
      .filter((m: any) => ["SALE", "CLIENT_PAYMENT"].includes(m.type))
      .reduce((acc: number, m: any) => acc + Number(m.amount), 0);
    const mvtOutputs = movements
      .filter((m: any) => ["SUPPLIER_PAYMENT", "EXPENSE"].includes(m.type))
      .reduce((acc: number, m: any) => acc + Number(m.amount), 0);
    const finalBalance =
      Number(sessionData.openingAmount) + mvtEntries - mvtOutputs;

    const rows = movements
      .map((m: any) => {
        const isEntry = ["SALE", "CLIENT_PAYMENT"].includes(m.type);
        const time = new Date(m.createdAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const pMethod =
          m.paymentMethod === "CASH" ? "Espèces" : m.paymentMethod;
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">${time}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;"><strong>${m.type === "SALE" ? "Entrée" : m.type === "CLIENT_PAYMENT" ? "Dette Client" : m.type === "SUPPLIER_PAYMENT" ? "Fournisseur" : "Dépense"}</strong> - ${m.label}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;">${pMethod}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: bold; color: ${isEntry ? "#10b981" : "#ef4444"};">
            ${isEntry ? "+" : "-"} ${Number(m.amount).toLocaleString("fr-FR")} FCFA
          </td>
        </tr>
      `;
      })
      .join("");

    const printContent = `
      <html>
        <head>
          <title>Rapport de Caisse - ${formattedDate}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
              background: #ffffff;
              font-size: 14px;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
            }
            .header p {
              margin: 5px 0 0;
              color: #64748b;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .meta-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 15px;
              border-radius: 12px;
            }
            .meta-title {
              font-size: 11px;
              text-transform: uppercase;
              font-weight: 700;
              color: #94a3b8;
              margin-bottom: 5px;
              letter-spacing: 0.05em;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 40px;
            }
            .summary-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              text-align: center;
            }
            .summary-card.opening { border-left: 4px solid #64748b; background: #f8fafc; }
            .summary-card.entries { border-left: 4px solid #10b981; background: #f0fdf4; }
            .summary-card.outputs { border-left: 4px solid #ef4444; background: #fef2f2; }
            .summary-card.final { border-left: 4px solid #3b82f6; background: #eff6ff; }
            .summary-card h3 {
              margin: 0 0 5px;
              font-size: 11px;
              text-transform: uppercase;
              color: #64748b;
            }
            .summary-card p {
              margin: 0;
              font-size: 18px;
              font-weight: 800;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            th {
              background: #f1f5f9;
              text-align: left;
              padding: 12px;
              font-weight: 700;
              font-size: 12px;
              color: #475569;
              border-bottom: 2px solid #e2e8f0;
            }
            .text-right { text-align: right; }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #94a3b8;
              font-size: 11px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            .signature-space {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 200px;
              border-top: 1px dashed #cbd5e1;
              text-align: center;
              padding-top: 8px;
              color: #64748b;
              font-size: 12px;
            }
            @media print {
              body { padding: 0; }
              .container { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <h1>SamaStock • Rapport Journalier de Caisse</h1>
                <p>Date d'impression : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div>
                <strong style="font-size: 16px; color: #0f172a;">SamaStock</strong>
              </div>
            </div>
            
            <div class="meta-grid">
              <div class="meta-card">
                <div class="meta-title">Session et Opérateur</div>
                <strong>Responsable :</strong> ${user}<br>
                <strong>Date de session :</strong> ${formattedDate}
              </div>
              <div class="meta-card">
                <div class="meta-title">Horaires de Caisse</div>
                <strong>Ouverture :</strong> ${openedTime}<br>
                <strong>Fermeture :</strong> ${closedTime}
              </div>
            </div>
  
            <div class="summary-grid">
              <div class="summary-card opening">
                <h3>Ouverture</h3>
                <p style="color: #475569;">${Number(sessionData.openingAmount).toLocaleString("fr-FR")} F</p>
              </div>
              <div class="summary-card entries">
                <h3>Entrées</h3>
                <p style="color: #10b981;">+${mvtEntries.toLocaleString("fr-FR")} F</p>
              </div>
              <div class="summary-card outputs">
                <h3>Sorties</h3>
                <p style="color: #ef4444;">-${mvtOutputs.toLocaleString("fr-FR")} F</p>
              </div>
              <div class="summary-card final">
                <h3>Solde Final</h3>
                <p style="color: #2563eb;">${finalBalance.toLocaleString("fr-FR")} F</p>
              </div>
            </div>
  
            <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 15px; color: #0f172a;">Mouvements de Caisse</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
              <thead>
                <tr>
                  <th style="background: #f1f5f9; text-align: left; padding: 12px; font-weight: 700; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0; width: 80px;">Heure</th>
                  <th style="background: #f1f5f9; text-align: left; padding: 12px; font-weight: 700; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0;">Détails de l'opération</th>
                  <th style="background: #f1f5f9; text-align: left; padding: 12px; font-weight: 700; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0; width: 120px;">Paiement</th>
                  <th style="background: #f1f5f9; text-align: right; padding: 12px; font-weight: 700; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0; width: 150px;">Montant</th>
                </tr>
              </thead>
              <tbody>
                ${rows.length > 0 ? rows : '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">Aucun mouvement enregistré durant cette session.</td></tr>'}
              </tbody>
            </table>
  
            <div class="signature-space">
              <div class="signature-box">Signature Caissier</div>
              <div class="signature-box">Signature Responsable</div>
            </div>
  
            <div class="footer">
              SamaStock • Logiciel de gestion de stock intelligente et comptabilité de caisse.
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const totalEntries: number =
    session?.movements?.reduce((acc: number, movement: any) => {
      if (movement.type === "SALE" || movement.type === "CLIENT_PAYMENT") {
        return Number(acc + Number(movement.amount));
      }
      return acc;
    }, 0) || 0;

  const totalOutputs: number =
    session?.movements?.reduce((acc: number, movement: any) => {
      if (movement.type === "SUPPLIER_PAYMENT" || movement.type === "EXPENSE") {
        return Number(acc + Number(movement.amount));
      }
      return acc;
    }, 0) || 0;

  const currentTheoreticalBalance = session
    ? Number(session.openingAmount) +
      Number(totalEntries) -
      Number(totalOutputs)
    : 0;

  const getPaymentMethodBadgeClass = (method: string) => {
    switch (method) {
      case "WAVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "ORANGE_MONEY":
        return "bg-orange-50 text-orange-700 border-orange-100";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "WAVE":
        return "🟢 Wave";
      case "ORANGE_MONEY":
        return "🟠 Orange Money";
      default:
        return "⚫ Espèces";
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
      {/* HEADER AVEC ONGLETS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl">
              <Wallet size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Gestion de Caisse
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Suivi financier en temps réel, transactions journalières et
                historiques de clôture.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-end">
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto">
            <button
              onClick={() => setActiveTab("caisse")}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "caisse"
                  ? "bg-white shadow-md text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Activity size={16} /> Session Actuelle
            </button>
            <button
              onClick={() => setActiveTab("historique")}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "historique"
                  ? "bg-white shadow-md text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <History size={16} /> Journal des Clôtures
            </button>
          </div>
        </div>
      </div>

      {activeTab === "caisse" ? (
        <>
          {/* SI LA CAISSE EST FERMEE */}
          {!session ? (
            <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 text-center space-y-8 mt-12 transition-all hover:shadow-2xl">
              <div className="mx-auto w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center shadow-inner animate-pulse">
                <Lock size={38} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">
                  La caisse est fermée
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed px-4">
                  Pour commencer à enregistrer des ventes et des opérations,
                  veuillez saisir le montant de départ de la caisse.
                </p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    FCFA
                  </span>
                  <input
                    type="number"
                    placeholder="Ex: 50 000"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-16 pr-5 py-5 text-left text-2xl font-black text-slate-950 focus:ring-2 focus:ring-slate-900 outline-none transition-all shadow-inner"
                  />
                </div>
                <button
                  onClick={openCash}
                  disabled={openingSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                >
                  {openingSubmitting
                    ? "Ouverture en cours..."
                    : "Ouvrir la caisse"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* CARTES STATS PREMIUM */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* SOLDE ACTUEL */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-between h-[150px] relative overflow-hidden group">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
                    <Wallet size={120} />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-black uppercase tracking-wider">
                      Solde actuel théorique
                    </span>
                    <h2 className="text-3xl font-black tracking-tight mt-2 text-emerald-400">
                      {currentTheoreticalBalance.toLocaleString("fr-FR")} FCFA
                    </h2>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Ouvert aujourd'hui
                    </span>
                  </div>
                </div>

                {/* ENTREES */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-[150px]">
                  <div>
                    <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">
                      Entrées du jour
                    </span>
                    <h2 className="text-3xl font-black text-emerald-600 mt-2 tracking-tight">
                      +{totalEntries.toLocaleString("fr-FR")} FCFA
                    </h2>
                  </div>
                  <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                    <ArrowUpRight
                      size={14}
                      className="p-0.5 bg-emerald-100 rounded-full"
                    />
                    Mouvements entrants
                  </div>
                </div>

                {/* SORTIES */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-[150px]">
                  <div>
                    <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">
                      Sorties du jour
                    </span>
                    <h2 className="text-3xl font-black text-rose-600 mt-2 tracking-tight">
                      -{totalOutputs.toLocaleString("fr-FR")} FCFA
                    </h2>
                  </div>
                  <div className="text-xs text-rose-500 font-bold flex items-center gap-1">
                    <ArrowDownLeft
                      size={14}
                      className="p-0.5 bg-rose-100 rounded-full"
                    />
                    Dépenses et règlements
                  </div>
                </div>

                {/* TRANSACTIONS */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-[150px]">
                  <div>
                    <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">
                      Transactions du jour
                    </span>
                    <h2 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                      {session?.movements?.length || 0}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 font-bold flex items-center justify-between">
                    <span>Fond de départ :</span>
                    <span className="font-black text-slate-800">
                      {Number(session.openingAmount).toLocaleString("fr-FR")} F
                    </span>
                  </div>
                </div>
              </div>

              {/* BARRE D'ACTIONS */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-bold text-sm transition-all shadow-md hover:shadow-lg"
                  >
                    <PlusCircle size={18} /> + Nouvelle opération
                  </button>
                  <button
                    onClick={() => handlePrintReport(session)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-2xl flex items-center gap-2 font-bold text-sm transition-all"
                  >
                    <Printer size={18} /> Imprimer rapport caisse
                  </button>
                </div>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-bold text-sm transition-all shadow-md hover:shadow-lg"
                >
                  <Lock size={18} /> Fermer la caisse
                </button>
              </div>

              {/* TABLEAU DES TRANSACTIONS DE LA SESSION */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <History size={20} className="text-slate-400" />
                    Historique des mouvements de session
                  </h2>
                  <span className="px-3.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                    {session?.movements?.length || 0} opération(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
                        <th className="p-5 pl-8">Heure</th>
                        <th className="p-5">Type / Catégorie</th>
                        <th className="p-5">Description</th>
                        <th className="p-5">Paiement</th>
                        <th className="p-5 text-right pr-8">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                      {session.movements.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-16 text-center text-slate-400"
                          >
                            <TrendingUp
                              size={40}
                              className="mx-auto mb-3 opacity-20 text-slate-500"
                            />
                            <p className="font-bold text-slate-500">
                              Aucune opération pour le moment.
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Les ventes et versements apparaîtront ici
                              automatiquement.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        session.movements.map((movement: any) => {
                          const isEntry = ["SALE", "CLIENT_PAYMENT"].includes(
                            movement.type,
                          );

                          // Decode category label and note
                          const parts = movement.label.split(": ");
                          const typeLabel =
                            parts[0] || (isEntry ? "Entrée" : "Sortie");
                          const labelDesc =
                            parts[1] || movement.note || "Opération manuelle";

                          return (
                            <tr
                              key={movement.id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="p-5 pl-8 text-slate-400 font-medium">
                                {new Date(
                                  movement.createdAt,
                                ).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="p-5">
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-black border ${
                                    isEntry
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      : "bg-rose-50 text-rose-700 border-rose-100"
                                  }`}
                                >
                                  {typeLabel}
                                </span>
                              </td>
                              <td className="p-5 font-bold text-slate-900">
                                <p>{labelDesc}</p>
                                {movement.note && parts[1] && (
                                  <span className="text-xs text-slate-400 font-medium font-mono">
                                    {movement.note}
                                  </span>
                                )}
                              </td>
                              <td className="p-5">
                                <span
                                  className={`px-3 py-1 rounded-xl text-xs font-bold border ${getPaymentMethodBadgeClass(movement.paymentMethod)}`}
                                >
                                  {getPaymentMethodLabel(
                                    movement.paymentMethod,
                                  )}
                                </span>
                              </td>
                              <td
                                className={`p-5 text-right pr-8 font-black text-base ${isEntry ? "text-emerald-600" : "text-rose-600"}`}
                              >
                                {isEntry ? "+" : "-"}{" "}
                                {Number(movement.amount).toLocaleString(
                                  "fr-FR",
                                )}{" "}
                                FCFA
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
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Calendar size={22} className="text-slate-400" />
              Journal Historique des Sessions
            </h2>

            <div className="space-y-4">
              {history.filter((h) => !h.isOpen).length === 0 ? (
                <div className="p-16 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                  <Lock size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-slate-500">
                    Aucun historique de caisse clos disponible.
                  </p>
                </div>
              ) : (
                history
                  .filter((h) => !h.isOpen)
                  .map((journal: any) => {
                    const mvtEntries = journal.movements
                      .filter((m: any) =>
                        ["SALE", "CLIENT_PAYMENT"].includes(m.type),
                      )
                      .reduce((a: number, b: any) => a + Number(b.amount), 0);
                    const mvtOutputs = journal.movements
                      .filter((m: any) =>
                        ["SUPPLIER_PAYMENT", "EXPENSE"].includes(m.type),
                      )
                      .reduce((a: number, b: any) => a + Number(b.amount), 0);
                    const bal =
                      Number(journal.openingAmount) + mvtEntries - mvtOutputs;

                    return (
                      <div
                        key={journal.id}
                        className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-6 items-center hover:bg-slate-50 hover:border-slate-200 transition-all"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                            Date & Auteur
                          </p>
                          <p className="text-sm font-black text-slate-900">
                            {new Date(journal.openedAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <User size={12} />{" "}
                            {journal.user?.name || "Caissier"}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                            Fond d'ouverture
                          </p>
                          <p className="text-sm font-bold text-slate-700">
                            {Number(journal.openingAmount).toLocaleString(
                              "fr-FR",
                            )}{" "}
                            FCFA
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-black text-emerald-500 uppercase tracking-wider">
                            Total Entrées
                          </p>
                          <p className="text-sm font-black text-emerald-600">
                            +{mvtEntries.toLocaleString("fr-FR")} FCFA
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-black text-rose-500 uppercase tracking-wider">
                            Total Sorties
                          </p>
                          <p className="text-sm font-black text-rose-600">
                            -{mvtOutputs.toLocaleString("fr-FR")} FCFA
                          </p>
                        </div>

                        <div className="flex items-center justify-between md:justify-end md:gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                          <div className="text-left md:text-right">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                              Solde Final
                            </p>
                            <p className="text-base font-black text-slate-950">
                              {(journal.closingAmount || bal).toLocaleString(
                                "fr-FR",
                              )}{" "}
                              F
                            </p>
                          </div>

                          <button
                            onClick={() => handlePrintReport(journal)}
                            title="Imprimer le rapport de caisse de cette journée"
                            className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          >
                            <Printer size={16} />
                          </button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form
            onSubmit={handleCreateMovement}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 max-w-md w-full space-y-6 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>

            <div>
              <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                Nouvelle opération
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Ajouter un mouvement financier manuel à la session de caisse
                actuelle.
              </p>
            </div>

            {/* TYPE SELECTION SWITCH */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Type de mouvement
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOpType("ENTREE")}
                  className={`py-3.5 rounded-xl font-bold text-sm transition-all ${
                    opType === "ENTREE"
                      ? "bg-white shadow-md text-emerald-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🟢 Entrée
                </button>
                <button
                  type="button"
                  onClick={() => setOpType("SORTIE")}
                  className={`py-3.5 rounded-xl font-bold text-sm transition-all ${
                    opType === "SORTIE"
                      ? "bg-white shadow-md text-rose-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🔴 Sortie
                </button>
              </div>
            </div>

            {/* CATEGORY DYNAMIC DROPDOWN */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Catégorie d'opération
              </label>
              <select
                value={opCategory}
                onChange={(e) => setOpCategory(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
              >
                {opType === "ENTREE" ? (
                  <>
                    <option value="Vente">Vente</option>
                    <option value="Paiement dette client">
                      Paiement dette client
                    </option>
                    <option value="Autre revenu">Autre revenu</option>
                  </>
                ) : (
                  <>
                    <option value="Paiement fournisseur">
                      Paiement fournisseur
                    </option>
                    <option value="Transport">Transport</option>
                    <option value="Dépense boutique">Dépense boutique</option>
                    <option value="Salaire">Salaire</option>
                    <option value="Électricité">Électricité</option>
                  </>
                )}
              </select>
            </div>

            {/* DESCRIPTION / LIBELLE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Libellé / Titre de l'opération *
              </label>
              <input
                type="text"
                required
                value={mvtLabel}
                onChange={(e) => setMvtLabel(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-900 outline-none placeholder-slate-400 font-medium"
                placeholder="Ex: Facture Senelec, Paiement transporteur, etc."
              />
            </div>

            {/* MONTANT ET PAIEMENT SENEGAL */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  value={mvtAmount}
                  onChange={(e) => setMvtAmount(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-900 outline-none font-black text-slate-900 text-lg"
                  placeholder="Ex: 10000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Moyen de paiement
                </label>
                <select
                  value={mvtMethod}
                  onChange={(e) => setMvtMethod(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  <option value="CASH">Espèces (⚫)</option>
                  <option value="WAVE">Wave (🟢)</option>
                  <option value="ORANGE_MONEY">Orange Money (🟠)</option>
                </select>
              </div>
            </div>

            {/* NOTE ADDITIONNELLE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Note additionnelle (Optionnel)
              </label>
              <textarea
                value={mvtNote}
                onChange={(e) => setMvtNote(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none font-medium h-20 resize-none"
                placeholder="Détails supplémentaires..."
              />
            </div>

            {/* SUBMIT BUTTONS */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-1/2 border border-slate-200 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submittingMovement}
                className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-50"
              >
                {submittingMovement ? "Validation..." : "Valider"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE CLOTURE */}
      {showCloseModal && session && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowCloseModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                <AlertCircle size={30} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                  Clôture Journalière
                </h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Veuillez vérifier les comptes de la journée avant de
                  verrouiller la session de caisse.
                </p>
              </div>
            </div>

            {/* RECAP CLOSING LIST */}
            <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">
                  Fond d'Ouverture
                </span>
                <span className="font-black text-slate-800">
                  {Number(session.openingAmount).toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">
                  Total Entrées (+)
                </span>
                <span className="font-black text-emerald-600">
                  +{totalEntries.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">
                  Total Sorties (-)
                </span>
                <span className="font-black text-rose-600">
                  -{totalOutputs.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              <div className="h-px bg-slate-200 my-2"></div>

              <div className="flex justify-between items-center">
                <span className="text-slate-900 font-black text-sm">
                  Solde Final Théorique
                </span>
                <span className="font-black text-slate-900 text-lg">
                  {currentTheoreticalBalance.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-800 leading-relaxed font-semibold">
              ⚠️ Attention : Une fois fermée, vous ne pourrez plus ajouter de
              ventes ou de mouvements à cette session de caisse. Une nouvelle
              ouverture sera requise pour recommencer.
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="w-1/2 border border-slate-200 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
              >
                Annuler
              </button>
              <button
                onClick={closeCash}
                disabled={closingSubmitting}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-50"
              >
                {closingSubmitting ? "Clôture..." : "Confirmer Clôture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
