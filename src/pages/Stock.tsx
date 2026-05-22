import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Package,
  Loader2,
  Plus,
  Minus,
  History,
} from "lucide-react";

import { getProducts } from "../services/product.service";

import {
  addStockEntry,
  addStockOut,
  getStockMovements,
  type StockPayload,
} from "../services/stock.service";

import type { Product } from "../types/product";
import type { StockMovement } from "../types/stock";

export default function Stock() {
  // ===============================
  // STATES
  // ===============================
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [movementType, setMovementType] = useState<"ENTRY" | "OUT">("ENTRY");

  const [showAllMovements, setShowAllMovements] = useState(false);

  const [formData, setFormData] = useState<StockPayload>({
    productId: 0,
    quantity: 1,
    note: "",
  });

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchData = async () => {
    try {
      const [productsResponse, movementsResponse] = await Promise.all([
        getProducts(1, 10),
        getStockMovements(),
      ]);

      setProducts(productsResponse.data || []);

      // IMPORTANT :
      // On filtre les ventes
      const filteredMovements = (movementsResponse || []).filter(
        (m: StockMovement) => m.type === "ENTRY" || m.type === "OUT",
      );

      setMovements(filteredMovements);
    } catch (error) {
      console.error(error);

      // ⚠️ ON NE MET PAS DE TOAST ERROR ICI
      // sinon même après succès ça affiche erreur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===============================
  // STATS
  // ===============================
  const stats = useMemo(() => {
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= 5,
    ).length;

    const outOfStock = products.filter((p) => p.quantity === 0).length;

    return {
      lowStock,
      outOfStock,
      total: products.length,
    };
  }, [products]);

  // ===============================
  // SUBMIT
  // ===============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.productId === 0) {
      return toast.error("Sélectionnez un produit");
    }

    if (!formData.quantity || formData.quantity <= 0) {
      return toast.error("Quantité invalide");
    }

    setSubmitting(true);

    try {
      // ===============================
      // ENTRÉE
      // ===============================
      if (movementType === "ENTRY") {
        await addStockEntry(formData);

        toast.success("Entrée de stock enregistrée");
      }

      // ===============================
      // SORTIE
      // ===============================
      else {
        await addStockOut(formData);

        toast.success("Retrait de stock enregistré");
      }

      // ===============================
      // RELOAD
      // ===============================
      await fetchData();

      // RESET
      setFormData({
        productId: 0,
        quantity: 1,
        note: "",
      });
    } catch (error: any) {
      console.error(error);

      toast.error(error?.response?.data?.details || "Erreur lors du mouvement");
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================
  // VISIBLE MOVEMENTS
  // ===============================
  const visibleMovements = showAllMovements ? movements : movements.slice(0, 6);

  // ===============================
  // LOADING
  // ===============================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-700 font-bold">
          <Loader2 className="animate-spin" size={22} />
          Chargement du stock...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-[1450px] mx-auto space-y-8">
        {/* ===================================== */}
        {/* HEADER */}
        {/* ===================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-black text-slate-900">
              Gestion du Stock
            </h1>

            <p className="text-slate-500 mt-2">
              Gérez les entrées et retraits de stock.
            </p>
          </div>

          {/* Stock critique */}
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5 flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-2xl text-white">
              <AlertTriangle size={22} />
            </div>

            <div>
              <p className="text-xs uppercase font-black tracking-widest text-orange-600">
                Stock critique
              </p>

              <h3 className="text-2xl font-black text-orange-900">
                {stats.lowStock}
              </h3>
            </div>
          </div>

          {/* Ruptures */}
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex items-center gap-4">
            <div className="bg-rose-500 p-3 rounded-2xl text-white">
              <Package size={22} />
            </div>

            <div>
              <p className="text-xs uppercase font-black tracking-widest text-rose-600">
                Ruptures
              </p>

              <h3 className="text-2xl font-black text-rose-900">
                {stats.outOfStock}
              </h3>
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* CONTENT */}
        {/* ===================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* ===================================== */}
          {/* FORM */}
          {/* ===================================== */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-[30px] p-8 border border-slate-100 shadow-sm sticky top-6">
              <h2 className="text-xl font-black text-slate-900 mb-6">
                Nouveau mouvement
              </h2>

              {/* TOGGLE */}
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                <button
                  type="button"
                  onClick={() => setMovementType("ENTRY")}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all ${
                    movementType === "ENTRY"
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-500"
                  }`}
                >
                  <Plus size={18} />
                  Entrée
                </button>

                <button
                  type="button"
                  onClick={() => setMovementType("OUT")}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all ${
                    movementType === "OUT"
                      ? "bg-white shadow-sm text-rose-600"
                      : "text-slate-500"
                  }`}
                >
                  <Minus size={18} />
                  Retrait
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* PRODUIT */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    Produit
                  </label>

                  <select
                    value={formData.productId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productId: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value={0}>Sélectionner un produit...</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.quantity} en stock)
                      </option>
                    ))}
                  </select>
                </div>

                {/* QUANTITY */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    Quantité
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 rounded-2xl text-white font-black shadow-lg transition-all disabled:opacity-50 ${
                    movementType === "ENTRY"
                      ? "bg-slate-900 hover:bg-slate-800"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Traitement...
                    </span>
                  ) : (
                    <>
                      {movementType === "ENTRY"
                        ? "Confirmer l'entrée"
                        : "Confirmer le retrait"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ===================================== */}
          {/* HISTORY */}
          {/* ===================================== */}
          <div className="xl:col-span-3 space-y-6">
            <div className="flex items-center gap-2">
              <History className="text-slate-400" />

              <h2 className="text-xl font-black text-slate-900">
                Historique des mouvements
              </h2>
            </div>

            <div className="space-y-4">
              {visibleMovements.length === 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-slate-500 font-medium">
                  Aucun mouvement enregistré
                </div>
              )}

              {visibleMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all"
                >
                  {/* LEFT */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-2xl ${
                        movement.type === "ENTRY"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {movement.type === "ENTRY" ? (
                        <ArrowUpCircle size={24} />
                      ) : (
                        <ArrowDownCircle size={24} />
                      )}
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900">
                        {movement.product?.name}
                      </h3>

                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        {new Date(movement.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {movement.note && (
                        <p className="text-sm text-slate-500 mt-2">
                          {movement.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right">
                    <h3
                      className={`text-2xl font-black ${
                        movement.type === "ENTRY"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {movement.type === "ENTRY" ? "+" : "-"}
                      {movement.quantity}
                    </h3>

                    <p className="text-[10px] uppercase tracking-[2px] font-black text-slate-300">
                      {movement.type === "ENTRY" ? "Entrée" : "Retrait"}
                    </p>
                  </div>
                </div>
              ))}

              {/* BUTTON */}
              {movements.length > 6 && (
                <button
                  onClick={() => setShowAllMovements(!showAllMovements)}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all"
                >
                  {showAllMovements
                    ? "Réduire l'historique"
                    : `Voir les ${movements.length - 6} autres mouvements`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
