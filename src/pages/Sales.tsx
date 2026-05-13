import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { 
  Plus, Trash2, ShoppingCart, User, Package, 
  CreditCard, Printer, X, CheckCircle2, AlertCircle, Minus 
} from "lucide-react"; 
import { getClients } from "../services/client.service";
import { getProducts } from "../services/product.service";
import { createSale, getSales } from "../services/sale.service";

// --- Garde tes types d'origine ---
type Product = { id: number; name: string; category?: string; reference?: string; quantity: number; salePrice: number; };
type Client = { id: number; name: string; phone: string; };
type Sale = { id: number; quantity: number; unitPrice: number; totalAmount: number; paidAmount: number; remaining: number; createdAt: string; customer?: string | null; product?: { id: number; name: string; }; client?: { id: number; name: string; }; };
type CartItem = { productId: number; productName: string; stock: number; unitPrice: number; quantity: number; total: number; };
type SalePayload = { productId: number; clientId?: number; quantity: number; paidAmount?: number; customer?: string; };
type InvoiceData = { invoiceNumber: string; clientName: string; createdAt: string; items: CartItem[]; totalAmount: number; paidAmount: number; remainingAmount: number; };

export default function Sales() {
  // --- États d'origine ---
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [clientId, setClientId] = useState<number>(0);
  const [customerName, setCustomerName] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const invoiceRef = useRef<HTMLDivElement | null>(null);

  // --- Fonctions utilitaires et Data Fetching ---
  const formatCurrency = (value: number) => `${value.toLocaleString("fr-FR")} FCFA`;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, c, s] = await Promise.all([getProducts(), getClients(), getSales()]);
      setProducts(Array.isArray(p) ? p : p?.data || []);
      setClients(c || []);
      setSales(s || []);
    } catch (e) { toast.error("Erreur de chargement"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Logique métier (Calculs) ---
  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const remainingAmount = useMemo(() => Math.max(0, totalAmount - Number(paidAmount || 0)), [totalAmount, paidAmount]);
  const totalSalesAmount = useMemo(() => sales.reduce((sum, s) => sum + s.totalAmount, 0), [sales]);
  const recentSales = useMemo(() => showAllHistory ? sales : sales.slice(0, 6), [sales, showAllHistory]);
  const selectedProduct = useMemo(() => products.find((p) => p.id === selectedProductId) || null, [products, selectedProductId]);

  // --- Actions du Panier ---
  const addToCart = () => {
    if (!selectedProduct) return toast.error("Sélectionnez un produit");
    if (selectedQuantity > selectedProduct.quantity) return toast.error("Stock insuffisant");

    setCart(prev => {
      const existing = prev.find(i => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map(i => i.productId === selectedProduct.id 
          ? { ...i, quantity: i.quantity + selectedQuantity, total: (i.quantity + selectedQuantity) * i.unitPrice } 
          : i
        );
      }
      return [...prev, { 
        productId: selectedProduct.id, productName: selectedProduct.name, 
        stock: selectedProduct.quantity, unitPrice: Number(selectedProduct.salePrice), 
        quantity: selectedQuantity, total: Number(selectedProduct.salePrice) * selectedQuantity 
      }];
    });
    setSelectedProductId(0);
    setSelectedQuantity(1);
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.productId !== id));

  // --- Soumission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error("Panier vide");
    setSubmitting(true);
    try {
      let remainingToPay = Number(paidAmount);
      for (const item of cart) {
        const linePaid = Math.min(remainingToPay, item.total);
        const payload: SalePayload = { productId: item.productId, quantity: item.quantity, paidAmount: linePaid };
        clientId !== 0 ? payload.clientId = clientId : payload.customer = customerName;
        await createSale(payload);
        remainingToPay -= linePaid;
      }
      toast.success("Vente réussie");
      setCart([]);
      setPaidAmount(0);
      fetchData();
    } catch (err) { toast.error("Erreur lors de la vente"); } finally { setSubmitting(false); }
  };

  return (
    <section className="max-w-[1400px] mx-auto p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">SamaStock</h1>
          <p className="text-slate-500">Tableau de bord des ventes</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[150px]">
            <p className="text-xs font-bold text-slate-400 uppercase">Total Vendu</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(totalSalesAmount)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Formulaire à gauche (8/12) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <User size={20} className="text-blue-500" />
              <h2 className="text-xl font-bold">Client & Produit</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <select 
                value={clientId} 
                onChange={(e) => setClientId(Number(e.target.value))}
                className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Client passager</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input 
                placeholder="Nom du client..." 
                disabled={clientId !== 0}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-3 disabled:opacity-50"
              />
            </div>

            <div className="mt-8 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Rechercher un produit</label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full bg-slate-50 border-none rounded-xl p-3"
                >
                  <option value={0}>Choisir un article...</option>
                  {products.filter(p => p.quantity > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.salePrice)})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                <button onClick={() => setSelectedQuantity(q => Math.max(1, q-1))} className="p-2"><Minus size={18}/></button>
                <span className="px-4 font-bold">{selectedQuantity}</span>
                <button onClick={() => setSelectedQuantity(q => q+1)} className="p-2"><Plus size={18}/></button>
              </div>
              <button onClick={addToCart} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800">
                <Plus size={18}/> Ajouter
              </button>
            </div>
          </div>

          {/* Tableau Historique */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
             <h2 className="text-xl font-bold mb-6">Ventes Récentes</h2>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-sm border-b">
                      <th className="pb-4">Produit</th>
                      <th className="pb-4">Client</th>
                      <th className="pb-4 text-right">Total</th>
                      <th className="pb-4 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map(s => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-4 font-medium">{s.product?.name}</td>
                        <td className="py-4 text-slate-500">{s.client?.name || s.customer}</td>
                        <td className="py-4 text-right font-bold">{formatCurrency(s.totalAmount)}</td>
                        <td className="py-4 text-right">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${s.remaining === 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {s.remaining === 0 ? "Payé" : "Reste"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Panier à droite (4/12) */}
        <div className="xl:col-span-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl sticky top-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart /> Panier</h2>
              <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">{cart.length} articles</span>
            </div>

            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center group">
                  <div className="text-sm">
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-slate-400">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Total HT</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Montant Reçu</label>
                <input 
                  type="number" value={paidAmount} 
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border-none rounded-xl p-3 text-white font-bold"
                />
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="font-bold">Reste</span>
                <span className="text-2xl font-black text-blue-400">{formatCurrency(remainingAmount)}</span>
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="w-full bg-blue-600 py-4 rounded-2xl font-bold text-lg hover:bg-blue-500 disabled:opacity-50 mt-4 transition-all"
              >
                {submitting ? "Traitement..." : "Valider la Vente"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}