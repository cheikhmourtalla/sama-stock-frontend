import { useEffect, useState } from "react";
import {
  Boxes,
  AlertTriangle,
  Ban,
  Wallet,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import { getDashboardStats } from "../services/dashboard.service";
import { getSales } from "../services/sale.service";
import { getProducts } from "../services/product.service";
import type { DashboardStats } from "../types/dashboard";
import type { Sale } from "../types/sale";
import type { Product } from "../types/product";
import SalesChart from "../components/SalesChart";
import StockChart from "../components/StockChart";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
};

function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
          <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, salesData, productsResponse] = await Promise.all([
          getDashboardStats(),
          getSales(),
          getProducts(),
        ]);

        setStats(statsData);
        setSales(salesData);
        setProducts(productsResponse.data);
      } catch (error) {
        console.error("Erreur dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString("fr-FR")} FCFA`;
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">
          Tableau de bord SamaStock
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Suivez rapidement vos produits, votre stock et vos ventes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total produits"
          value={stats?.totalProducts ?? 0}
          subtitle="Produits enregistrés dans le système"
          icon={<Boxes size={22} />}
        />

        <StatCard
          title="Stock faible"
          value={stats?.lowStockProducts ?? 0}
          subtitle="Produits à surveiller rapidement"
          icon={<AlertTriangle size={22} />}
        />

        <StatCard
          title="Rupture de stock"
          value={stats?.outOfStockProducts ?? 0}
          subtitle="Produits indisponibles actuellement"
          icon={<Ban size={22} />}
        />

        <StatCard
          title="Valeur du stock"
          value={formatCurrency(stats?.stockValue ?? 0)}
          subtitle="Valeur totale estimée du stock"
          icon={<Wallet size={22} />}
        />

        <StatCard
          title="Total ventes"
          value={stats?.totalSales ?? 0}
          subtitle="Nombre de ventes enregistrées"
          icon={<ShoppingCart size={22} />}
        />

        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(stats?.totalSalesAmount ?? 0)}
          subtitle="Montant total généré par les ventes"
          icon={<BarChart3 size={22} />}
        />
      </div>

      

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">
            Résumé de l'activité
          </h3>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-gray-600">Produits suivis</span>
              <span className="font-semibold text-slate-900">
                {stats?.totalProducts ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-gray-600">Alertes stock faible</span>
              <span className="font-semibold text-yellow-700">
                {stats?.lowStockProducts ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-gray-600">Produits en rupture</span>
              <span className="font-semibold text-red-700">
                {stats?.outOfStockProducts ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-gray-600">Ventes enregistrées</span>
              <span className="font-semibold text-slate-900">
                {stats?.totalSales ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">
            Situation financière
          </h3>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-sm text-white/70">Valeur actuelle du stock</p>
              <h4 className="mt-2 text-2xl font-bold">
                {formatCurrency(stats?.stockValue ?? 0)}
              </h4>
            </div>

            <div className="rounded-2xl bg-green-50 p-5">
              <p className="text-sm text-green-700">Chiffre d'affaires total</p>
              <h4 className="mt-2 text-2xl font-bold text-green-800">
                {formatCurrency(stats?.totalSalesAmount ?? 0)}
              </h4>
            </div>

            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm text-blue-700">Performance générale</p>
              <h4 className="mt-2 text-lg font-semibold text-blue-800">
                {stats && stats.totalSales > 0
                  ? "Des ventes ont déjà été enregistrées."
                  : "Aucune vente enregistrée pour le moment."}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}