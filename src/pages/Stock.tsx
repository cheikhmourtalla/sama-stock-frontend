import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownCircle, ArrowUpCircle, Package, AlertTriangle, History, Search, Plus, Minus } from "lucide-react";
import { getProducts } from "../services/product.service";
import { addStockEntry, addStockOut, getStockMovements, type StockPayload } from "../services/stock.service";
import type { Product } from "../types/product";
import type { StockMovement } from "../types/stock";

export default function Stock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementType, setMovementType] = useState<"ENTRY" | "OUT">("ENTRY");
  const [formData, setFormData] = useState<StockPayload>({ productId: 0, quantity: 0, note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showAllMovements, setShowAllMovements] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(false);
      const [productsResponse, movementsData] = await Promise.all([getProducts(), getStockMovements()]);
      setProducts(productsResponse.data);
      setMovements(movementsData);
    } catch (error) {
      toast.error("Erreur de synchronisation");
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Stats pour le Header
  const stockStats = useMemo(() => {
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 5).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    return { lowStock, outOfStock, totalItems: products.length };
  }, [products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.productId === 0) return toast.error("Sélectionnez un produit");
    
    setSubmitting(true);
    try {
      if (movementType === "ENTRY") await addStockEntry(formData);
      else await addStockOut(formData);
      
      toast.success(`${movementType === "ENTRY" ? "Entrée" : "Sortie"} enregistrée`);
      setFormData({ productId: 0, quantity: 0, note: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors du mouvement");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleMovements = showAllMovements ? movements : movements.slice(0, 6);

  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* HEADER & QUICK STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestion du Stock</h1>
          <p className="text-slate-500 mt-1">Suivez les flux de marchandises et anticipez les ruptures.</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-orange-500 p-3 rounded-xl text-white"><AlertTriangle size={20}/></div>
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase">Stock Critique</p>
            <p className="text-xl font-black text-orange-900">{stockStats.lowStock} articles</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-rose-500 p-3 rounded-xl text-white"><Package size={20}/></div>
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase">Ruptures</p>
            <p className="text-xl font-black text-rose-900">{stockStats.outOfStock} articles</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        
        {/* FORMULAIRE DE MOUVEMENT UNIQUE */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 sticky top-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Enregistrer un mouvement</h3>
            
            {/* TOGGLE TYPE */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
              <button 
                onClick={() => setMovementType("ENTRY")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${movementType === "ENTRY" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                <Plus size={18}/> Entrée
              </button>
              <button 
                onClick={() => setMovementType("OUT")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${movementType === "OUT" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"}`}
              >
                <Minus size={18}/> Sortie
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Produit concerné</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: Number(e.target.value)})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                >
                  <option value={0}>Sélectionner un produit...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.quantity} en stock)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Quantité</label>
                <input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 outline-none"
                  placeholder="0"
                />
              </div>

             

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all ${movementType === "ENTRY" ? "bg-slate-900 hover:bg-slate-800" : "bg-rose-600 hover:bg-rose-700"} disabled:opacity-50`}
              >
                {submitting ? "Traitement..." : `Confirmer la ${movementType === "ENTRY" ? "réception" : "sortie"}`}
              </button>
            </form>
          </div>
        </div>

        {/* HISTORIQUE TYPE TIMELINE */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <History className="text-slate-400" /> Flux d'activité récent
            </h3>
          </div>

          <div className="space-y-4">
            {visibleMovements.map((m) => (
              <div key={m.id} className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${m.type === "ENTRY" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {m.type === "ENTRY" ? <ArrowUpCircle size={24}/> : <ArrowDownCircle size={24}/>}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{m.product?.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {new Date(m.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-black ${m.type === "ENTRY" ? "text-emerald-600" : "text-rose-600"}`}>
                    {m.type === "ENTRY" ? "+" : "-"}{m.quantity}
                  </p>
                  <p className="text-[10px] uppercase font-black text-slate-300 tracking-widest">{m.type === "ENTRY" ? "Arrivage" : "Sortie"}</p>
                </div>
              </div>
            ))}

            {movements.length > 6 && (
              <button
                onClick={() => setShowAllMovements(!showAllMovements)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                {showAllMovements ? "Réduire l'historique" : `Voir les ${movements.length - 6} autres mouvements`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}