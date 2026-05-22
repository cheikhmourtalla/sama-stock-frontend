import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Package } from "lucide-react";

import {
  getProducts,
  updateProduct,
  allProducts,
  type UpdateProductPayload,
} from "../services/product.service";

type Props = {
  type: "low" | "critical";
};

type Product = {
  id: number;
  name: string;
  quantity: number;
  salePrice: number;
  purchasePrice: number;
  alertThreshold: number;
  description?: string | null;
};

export default function StockAlerts({ type }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await allProducts();

      const products = response?.data || [];

      console.log(allProducts);

      const filtered =
        type === "critical"
          ? products.filter((p: Product) => p.quantity <= 0)
          : products.filter(
              (p: Product) => p.quantity > 0 && p.quantity <= p.alertThreshold,
            );

      setProducts(filtered);

      if (response?.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error(error);

      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const updateQuantity = async (product: Product, quantity: number) => {
    try {
      await updateProduct(product.id, quantity as UpdateProductPayload);

      toast.success("Stock mis à jour");

      fetchProducts();
    } catch (error) {
      toast.error("Erreur mise à jour");
    }
  };

  const title = type === "critical" ? "Stocks critiques" : "Stocks faibles";

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black">{title}</h1>

        <p className="text-slate-500">Surveillance des produits en alerte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-3xl p-6 border border-slate-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">{product.name}</h3>

                <p className="text-sm text-slate-500">
                  {product.description || "Aucune description"}
                </p>
              </div>

              <div className="bg-slate-100 p-3 rounded-2xl">
                <Package size={20} />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span>Stock actuel</span>

                <span className="font-black">{product.quantity}</span>
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Modifier le stock
                </label>

                <input
                  type="number"
                  defaultValue={product.quantity}
                  onBlur={(e) =>
                    updateQuantity(product, Number(e.target.value))
                  }
                  className="w-full mt-2 bg-slate-50 rounded-2xl px-4 py-3"
                />
              </div>

              <div>
                <span
                  className={`px-3 py-2 rounded-xl text-xs font-bold ${
                    type === "critical"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {type === "critical" ? "Critique" : "Stock faible"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {/* <div className="flex items-center justify-center gap-3 mt-10">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-5 py-3 rounded-2xl border"
        >
          Précédent
        </button>

        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
          (pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              className={`w-12 h-12 rounded-2xl ${
                page === pageNumber
                  ? "bg-slate-900 text-white"
                  : "bg-white border"
              }`}
            >
              {pageNumber}
            </button>
          ),
        )}

        <button
          disabled={page === pagination.totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-5 py-3 rounded-2xl border"
        >
          Suivant
        </button>
      </div> */}
    </div>
  );
}
