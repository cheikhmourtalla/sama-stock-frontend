import { useEffect, useState } from "react";
import {
  Boxes,
  AlertTriangle,
  Wallet,
  ShoppingCart,
  TrendingUp,
  LayoutGrid,
  Clock,
  ArrowRight,
  PackageCheck,
} from "lucide-react";
import { getDashboardStats } from "../services/dashboard.service";
import { getSales } from "../services/sale.service";
import { allProducts } from "../services/product.service";

// Composant de Carte Statistique Ultra-Design
const StatCard = ({ title, value, icon }: any) => (
  <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm border border-slate-100 group hover:shadow-2xl transition-all duration-300">
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          {title}
        </p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
          {value}
        </h3>
      </div>
      <div
        className={`p-4 rounded-2xl bg-slate-50 text-slate-900 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300`}
      >
        {icon}
      </div>
    </div>
    <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-0 group-hover:opacity-10 transition-opacity">
      {icon && <div className="scale-[3]">{icon}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, salesData, productsData] = await Promise.all([
          getDashboardStats(),
          getSales(),
          allProducts(),
        ]);
        setStats(statsData);
        setRecentSales(Array.isArray(salesData) ? salesData.slice(0, 5) : []);
        const prods = productsData?.data || productsData || [];
        setLowStock(
          prods.filter((p: any) => p.quantity <= p.alertThreshold).slice(0, 4),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatPrice = (n: number) => n.toLocaleString() + " F";

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
            Chargement Sunustock
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* HEADER MODERNE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-4">
              <span className="p-3 bg-slate-900 rounded-[1.5rem] text-white shadow-2xl">
                <LayoutGrid size={32} />
              </span>
              Dashboard
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest ml-1">
              Analyse globale de votre activité
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-black text-xs uppercase tracking-widest">
              <Clock size={14} />{" "}
              {new Date().toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
              })}
            </div>
          </div>
        </div>

        {/* GRILLE DE STATS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard
            title="Produits"
            value={stats?.totalProducts || 0}
            icon={<Boxes size={24} />}
          />
          <StatCard
            title="Ventes"
            value={stats?.totalSales || 0}
            icon={<ShoppingCart size={24} />}
          />
          <StatCard
            title="Alertes"
            value={stats?.lowStockCount || 0}
            icon={<AlertTriangle size={24} />}
          />
          <StatCard
            title="Recettes"
            value={formatPrice(stats?.totalSalesAmount || 0)}
            icon={<Wallet size={24} />}
          />
        </div>

        {/* SECTION GRAPHIQUES ET FINANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* CARTE FINANCIÈRE NOIRE (EYE-CATCHER) */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <div className="relative z-10 space-y-8">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">
                    Valeur du Stock
                  </p>
                  <h2 className="text-4xl font-black tracking-tight">
                    {formatPrice(stats?.stockValue || 0)}
                  </h2>
                </div>
                <div className="h-[1px] bg-white/10 w-full"></div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">
                      Marge Estimée
                    </p>
                    <p className="text-2xl font-black">
                      {formatPrice((stats?.totalSalesAmount || 0) * 0.2)}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>
              {/* Cercle décoratif */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Statut Système
                </p>
                <p className="text-lg font-black text-slate-900 uppercase">
                  Opérationnel
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-pulse">
                <PackageCheck size={24} />
              </div>
            </div>
          </div>

          {/* LISTE DES VENTES RÉCENTES */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                Ventes Récentes
              </h3>
              <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-6">
              {recentSales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform">
                      #{sale.id.toString().slice(-2)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase text-sm tracking-tight">
                        {sale.product?.name || "Produit"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">
                      {formatPrice(sale.totalAmount)}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">
                      Payé
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ALERTES STOCK BAS */}
        <div className="bg-rose-50 rounded-[3rem] p-10 border border-rose-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black text-rose-900 uppercase italic tracking-tighter">
              Alertes Stock Critique
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {lowStock.map((p: any) => (
              <div
                key={p.id}
                className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col justify-between border border-rose-200/50"
              >
                <p className="font-black text-slate-900 uppercase text-xs mb-4 line-clamp-1">
                  {p.name}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      En Stock
                    </p>
                    <p className="text-2xl font-black text-rose-600">
                      {p.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Seuil
                    </p>
                    <p className="font-black text-slate-900">
                      {p.alertThreshold}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="col-span-full text-center text-rose-400 font-bold uppercase text-xs tracking-[0.2em] py-10">
                Aucun produit en rupture imminente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
