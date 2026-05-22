import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
   Wallet,
  CreditCard,
  AlertCircle,
  Calendar,
  User,
  Package,
  Receipt,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";

import { getSales, getSalesStats } from "../services/sale.service";

type Sale = {
  id: number;
  productId: number;
  clientId: number | null;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  paidAmount: string;
  remaining: string;
  customer: string | null;
  note: string | null;
  createdAt: string;

  product?: {
    id: number;
    name: string;
    quantity: number;
    salePrice: string;
  };

  client?: {
    id: number;
    name: string;
    phone: string;
  } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type SalesStats = {
  totalRevenue: number;
  totalPaid: number;
  totalRemaining: number;
  totalSales: number;
  totalProductsSold: number;
  todayRevenue: number;
};

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalSales: 0,
    totalProductsSold: 0,
    todayRevenue: 0,
  });

  /**
   * FILTRES
   */
  const [search, setSearch] = useState("");

  /**
   * LOAD SALES + STATS
   */
  const loadSales = async () => {
    try {
      setLoading(true);

      const [response, resSaleStat] = await Promise.all([
        getSales(page, 10),
        getSalesStats(),
      ]);

      setSales(response?.sales || []);

      setPagination(
        response?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        },
      );

      setStats(
        resSaleStat?.stats || {
          totalRevenue: 0,
          totalPaid: 0,
          totalRemaining: 0,
          totalSales: 0,
          totalProductsSold: 0,
          todayRevenue: 0,
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des ventes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [page]);

  /**
   * SEARCH FILTER
   */
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const productName = sale.product?.name || "";
      const customerName = sale.customer || "";

      return (
        productName.toLowerCase().includes(search.toLowerCase()) ||
        customerName.toLowerCase().includes(search.toLowerCase()) ||
        String(sale.id).includes(search)
      );
    });
  }, [sales, search]);

  /**
   * PRINT
   */
  const printSale = (sale: Sale) => {
    const content = `
      <html>
        <head>

          <style>
            body{
              font-family: Arial;
              padding:40px;
              color:#0f172a;
            }

            .container{
              max-width:700px;
              margin:auto;
            }

            .header{
              display:flex;
              justify-content:space-between;
              border-bottom:2px solid #e2e8f0;
              padding-bottom:20px;
              margin-bottom:30px;
            }

            .title{
              font-size:28px;
              font-weight:800;
            }

            .card{
              background:#f8fafc;
              border:1px solid #e2e8f0;
              padding:20px;
              border-radius:16px;
              margin-bottom:20px;
            }

            table{
              width:100%;
              border-collapse:collapse;
            }

            th,td{
              padding:12px;
              border-bottom:1px solid #e2e8f0;
              text-align:left;
            }

            .right{
              text-align:right;
            }

            .success{
              color:#059669;
              font-weight:bold;
            }

            .danger{
              color:#dc2626;
              font-weight:bold;
            }
          </style>
        </head>

        <body>
          <div class="container">

            <div class="header">
              <div>
                <p>${new Date(sale.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>

              <div>
                <strong>SamaStock</strong>
              </div>
            </div>

            <div class="card">
              <strong>Client :</strong> ${sale.customer || "Client inconnu"}<br/>
              <strong>Téléphone :</strong> ${sale.client?.phone || "-"}<br/>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Qté</th>
                  <th>Prix</th>
                  <th class="right">Total</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>${sale.product?.name || "Produit"}</td>
                  <td>${sale.quantity}</td>
                  <td>${Number(sale.unitPrice).toLocaleString("fr-FR")} F</td>
                  <td class="right">
                    ${Number(sale.totalAmount).toLocaleString("fr-FR")} F
                  </td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top:30px;">
              <p>
                <strong>Total :</strong>
                ${Number(sale.totalAmount).toLocaleString("fr-FR")} F
              </p>

              <p class="success">
                Payé :
                ${Number(sale.paidAmount).toLocaleString("fr-FR")} F
              </p>

              <p class="danger">
                Reste :
                ${Number(sale.remaining).toLocaleString("fr-FR")} F
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");

    if (!printWindow) return;

    printWindow.document.write(content);
    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* HEADER */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-950 flex items-center gap-3">
                <ShoppingBag className="text-indigo-600" size={30} />
                Historique des ventes
              </h1>

              <p className="text-slate-500 mt-2">
                Historique complet des ventes et statistiques globales.
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                placeholder="Rechercher une vente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-slate-900"
              />

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-black text-slate-400">
                  Montant payé
                </p>

                <h2 className="text-3xl font-black text-emerald-600 mt-2">
                  {stats.totalPaid.toLocaleString("fr-FR")} F
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Wallet size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-black text-slate-400">
                  Crédit restant
                </p>

                <h2 className="text-3xl font-black text-rose-600 mt-2">
                  {stats.totalRemaining.toLocaleString("fr-FR")} F
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertCircle size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-black text-slate-400">
                  Nombre de ventes
                </p>

                <h2 className="text-3xl font-black text-slate-950 mt-2">
                  {stats.totalSales}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Receipt size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">
              Liste des ventes
            </h2>

            <span className="bg-slate-100 px-4 py-2 rounded-full text-xs font-black text-slate-600">
              {pagination.total} vente(s)
            </span>
          </div>

          {loading ? (
            <div className="p-20 text-center text-slate-400">Chargement...</div>
          ) : (
            <>
              {/* MOBILE */}
              <div className="lg:hidden p-4 space-y-4">
                {filteredSales.map((sale) => {
                  const remaining = Number(sale.remaining);

                  return (
                    <div
                      key={sale.id}
                      className="border border-slate-100 rounded-3xl p-5 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(sale.createdAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>

                        <button
                          onClick={() => printSale(sale)}
                          className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center"
                        >
                          <Printer size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={15} className="text-slate-400" />

                          <span className="font-bold">
                            {sale.customer || "Client inconnu"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Package size={15} className="text-slate-400" />

                          <span>{sale.product?.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard size={15} className="text-slate-400" />

                          <span>{sale.quantity} article(s)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-2xl p-3">
                          <p className="text-[10px] font-black uppercase text-slate-400">
                            Total
                          </p>

                          <h4 className="font-black text-slate-950 mt-1">
                            {Number(sale.totalAmount).toLocaleString("fr-FR")} F
                          </h4>
                        </div>

                        <div className="bg-emerald-50 rounded-2xl p-3">
                          <p className="text-[10px] font-black uppercase text-emerald-500">
                            Payé
                          </p>

                          <h4 className="font-black text-emerald-600 mt-1">
                            {Number(sale.paidAmount).toLocaleString("fr-FR")} F
                          </h4>
                        </div>

                        <div className="bg-rose-50 rounded-2xl p-3">
                          <p className="text-[10px] font-black uppercase text-rose-500">
                            Reste
                          </p>

                          <h4 className="font-black text-rose-600 mt-1">
                            {remaining.toLocaleString("fr-FR")} F
                          </h4>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase">
                      <th className="p-5 text-left pl-8 font-black">Date</th>

                      <th className="p-5 text-left font-black">Client</th>

                      <th className="p-5 text-left font-black">Produit</th>

                      <th className="p-5 text-center font-black">Qté</th>

                      <th className="p-5 text-right font-black">Total</th>

                      <th className="p-5 text-right font-black">Payé</th>

                      <th className="p-5 text-right font-black">Reste</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-20 text-slate-400"
                        >
                          Aucune vente trouvée.
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((sale) => {
                        const remaining = Number(sale.remaining);

                        return (
                          <tr
                            key={sale.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-5 pl-8">
                              <div>
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(sale.createdAt).toLocaleDateString(
                                    "fr-FR",
                                  )}
                                </p>
                              </div>
                            </td>

                            <td className="p-5">
                              <div>
                                <h4 className="font-bold text-slate-900">
                                  {sale.customer || "Client inconnu"}
                                </h4>

                                <p className="text-xs text-slate-400 mt-1">
                                  {sale.client?.phone || "Aucun numéro"}
                                </p>
                              </div>
                            </td>

                            <td className="p-5">
                              <div>
                                <h4 className="font-bold text-slate-900">
                                  {sale.product?.name}
                                </h4>

                                <p className="text-xs text-slate-400 mt-1">
                                  {Number(sale.unitPrice).toLocaleString(
                                    "fr-FR",
                                  )}{" "}
                                  F
                                </p>
                              </div>
                            </td>

                            <td className="p-5 text-center font-black">
                              {sale.quantity}
                            </td>

                            <td className="p-5 text-right font-black text-slate-950">
                              {Number(sale.totalAmount).toLocaleString("fr-FR")}{" "}
                              F
                            </td>

                            <td className="p-5 text-right font-black text-emerald-600">
                              {Number(sale.paidAmount).toLocaleString("fr-FR")}{" "}
                              F
                            </td>

                            <td className="p-5 text-right">
                              <span
                                className={`font-black ${
                                  remaining > 0
                                    ? "text-rose-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {remaining.toLocaleString("fr-FR")} F
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-500">
                  Page {pagination.page} sur {pagination.totalPages}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="px-5 py-3 rounded-2xl border border-slate-200 bg-white font-bold disabled:opacity-40 flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    Précédent
                  </button>

                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() =>
                      setPage((prev) =>
                        Math.min(prev + 1, pagination.totalPages),
                      )
                    }
                    className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold disabled:opacity-40 flex items-center gap-2"
                  >
                    Suivant
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
