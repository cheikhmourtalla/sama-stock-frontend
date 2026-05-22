import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  AlertTriangle,
  Wallet,
  ShoppingCart,
  ArrowUpRight,
  // Activity,
  BarChart3,
  Layers3,
  TrendingUp,
  Sparkles,
  Package2,
  Receipt,
  Clock3,
} from "lucide-react";

import { getDashboardStats } from "../services/dashboard.service";
import { getSalestats } from "../services/sale.service";
import { allProducts } from "../services/product.service";

// =========================
// CARD STATS
// =========================
const StatCard = ({ title, value, icon, sub }: any) => {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 mb-3">
            {title}
          </p>

          <h2 className="text-4xl font-black tracking-tighter text-slate-900">
            {value}
          </h2>

          {sub && (
            <p className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {sub}
            </p>
          )}
        </div>

        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
          {icon}
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-100 rounded-full opacity-40 group-hover:bg-indigo-100 transition-colors"></div>
    </div>
  );
};

// =========================
// MAIN DASHBOARD
// =========================
export default function DashboardAlt() {
  const [stats, setStats] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [statsData, salesData, productsData] = await Promise.all([
          getDashboardStats(),
          getSalestats(),
          allProducts(),
        ]);

        setStats(statsData);
        console.log(statsData);

        setSales(Array.isArray(salesData.sales) ? salesData.sales : []);

        const prods = productsData?.data || productsData || [];

        setProducts(prods);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // =========================
  // CALCULS
  // =========================

  const recentSales = useMemo(() => {
    return sales.slice(0, 5);
  }, [sales]);

  const lowStock = useMemo(() => {
    return products
      .filter((p: any) => p.quantity <= p.alertThreshold)
      .slice(0, 5);
  }, [products]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 4);
  }, [products]);

  const totalQuantity = useMemo(() => {
    return products.reduce((acc: number, item: any) => {
      return acc + Number(item.quantity || 0);
    }, 0);
  }, [products]);

  const totalAlerts = useMemo(() => {
    return products.filter((p: any) => p.quantity <= p.alertThreshold).length;
  }, [products]);

  const latestSale = useMemo(() => {
    return sales[0];
  }, [sales]);

  // NOUVEAU
  const todayRevenue = useMemo(() => {
    return sales
      .filter((sale: any) => {
        const date = new Date(sale.createdAt);

        return date.toDateString() === new Date().toDateString();
      })
      .reduce((acc: number, sale: any) => {
        return acc + Number(sale.totalAmount || 0);
      }, 0);
  }, [sales]);

  const averageSale = useMemo(() => {
    if (!stats?.totalSales) return 0;

    return (
      Number(stats?.totalSalesAmount || 0) / Number(stats?.totalSales || 1)
    );
  }, [stats]);

  const alertRate = useMemo(() => {
    if (!stats?.totalProducts) return 0;

    return Math.round(
      ((stats?.lowStockCount || 0) / stats?.totalProducts) * 100,
    );
  }, [stats]);

  const formatPrice = (n: number) => {
    return Number(n || 0).toLocaleString("fr-FR") + " F";
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>

          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
            Chargement Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-[#F6F8FC] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 rounded-[1.8rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl">
                <BarChart3 size={28} />
              </div>

              <div>
                <h1 className="text-5xl font-black tracking-tighter uppercase italic text-slate-900">
                  Dashboard
                </h1>

                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-black mt-1">
                  Vue générale de votre business
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles size={22} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400">
                Aujourd'hui
              </p>

              <p className="font-black text-slate-900 text-lg uppercase">
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Produits"
            value={stats?.totalProducts || 0}
            icon={<Boxes size={28} />}
            sub="Produits enregistrés"
          />

          <StatCard
            title="Ventes"
            value={stats?.totalSales || 0}
            icon={<ShoppingCart size={28} />}
            sub="Transactions effectuées"
          />

          <StatCard
            title="Alertes"
            value={stats?.outOfStockProducts || 0}
            icon={<AlertTriangle size={28} />}
            sub="Produits critiques"
          />

          <StatCard
            title="Recettes"
            value={formatPrice(stats?.totalSalesAmount || 0)}
            icon={<Wallet size={28} />}
            sub="Montant total généré"
          />
        </div>

        {/* SECTION CENTRALE */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="xl:col-span-1 flex flex-col gap-8">
            {/* STOCK */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/60 mb-2">
                      Quantité Totale Stockée
                    </p>

                    <h2 className="text-5xl font-black tracking-tighter">
                      {totalQuantity}
                    </h2>
                  </div>

                  <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <Layers3 size={30} />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wider">
                    <span className="text-white/60">Produits en alerte</span>

                    <span>{totalAlerts}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wider">
                    <span className="text-white/60">Dernière vente</span>

                    <span>
                      {latestSale ? formatPrice(latestSale.totalAmount) : "0 F"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* INSIGHTS */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 mb-2">
                    Insights Business
                  </p>

                  <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                    Analyse Live
                  </h3>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    CA Aujourd'hui
                  </span>

                  <span className="font-black text-slate-900">
                    {formatPrice(todayRevenue)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Vente moyenne
                  </span>

                  <span className="font-black text-slate-900">
                    {formatPrice(averageSale)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Taux alerte
                  </span>

                  <span className="font-black text-rose-600">{alertRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="xl:col-span-2 flex flex-col gap-8">
            {/* VENTES RECENTES */}
            <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 mb-2">
                    Transactions
                  </p>

                  <h3 className="text-3xl font-black tracking-tight uppercase text-slate-900">
                    Ventes Récentes
                  </h3>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Receipt size={24} />
                </div>
              </div>

              <div className="space-y-5">
                {recentSales.map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black">
                        #{sale.id}
                      </div>

                      <div>
                        <p className="font-black uppercase text-slate-900 text-sm">
                          {sale.product?.name || "Produit"}
                        </p>

                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                          {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-slate-900">
                        {formatPrice(sale.totalAmount)}
                      </p>

                      <div className="flex items-center gap-1 justify-end text-emerald-600 text-xs font-black uppercase mt-1">
                        <ArrowUpRight size={13} />
                        Payé
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP PRODUITS */}
            <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 mb-2">
                    Inventaire
                  </p>

                  <h3 className="text-3xl font-black tracking-tight uppercase text-slate-900">
                    Produits les Plus Stockés
                  </h3>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Package2 size={24} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {topProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className="p-6 rounded-[2rem] border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-sm font-black uppercase text-slate-900 line-clamp-1">
                          {product.name}
                        </p>

                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-2">
                          Produit disponible
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                        <Package2 size={20} />
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                          Quantité
                        </p>

                        <h4 className="text-3xl font-black tracking-tight text-slate-900">
                          {product.quantity}
                        </h4>
                      </div>

                      <div className="text-emerald-600 flex items-center gap-1 text-xs font-black uppercase">
                        <TrendingUp size={14} />
                        Stable
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ALERTES */}
            <div className="bg-rose-50 border border-rose-100 rounded-[3rem] p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg">
                  <AlertTriangle size={24} />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-rose-400 mb-2">
                    Surveillance
                  </p>

                  <h3 className="text-3xl font-black tracking-tight uppercase text-rose-900">
                    Stock Critique
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {lowStock.map((product: any) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-[2rem] p-6 border border-rose-200"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="font-black uppercase text-sm text-slate-900 line-clamp-1">
                          {product.name}
                        </p>

                        <p className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mt-2">
                          Stock faible
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                        <Clock3 size={18} />
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                          Quantité
                        </p>

                        <h4 className="text-3xl font-black text-rose-600">
                          {product.quantity}
                        </h4>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                          Seuil
                        </p>

                        <p className="font-black text-slate-900">
                          {product.alertThreshold}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
