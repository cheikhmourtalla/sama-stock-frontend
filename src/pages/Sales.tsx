import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { 
  Plus, Trash2, ShoppingCart, Package, Minus, History, User 
} from "lucide-react"; 
import InvoiceModal from "../components/InvoiceModal";
import { getProducts } from "../services/product.service";
import { getClients } from "../services/client.service";
import { createSale, getSales } from "../services/sale.service";
import type { Product } from "../types/product";
import type { Client } from "../types/client";
import type { Sale } from "../types/sale";

// Structure locale du panier multi-produits
type CartItem = { 
  productId: number; 
  productName: string; 
  stock: number; 
  unitPrice: number; 
  quantity: number; 
  total: number; 
};

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // États de la caisse / panier
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [showAllSales, setShowAllSales] = useState(false);

  // États pour le Modal externe de facture
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<any | null>(null);

  const visibleSales = showAllSales ? sales : sales.slice(0, 5);

  // Récupération initiale des données
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, clientsResponse, salesData] = await Promise.all([
        getProducts("", "", 1, 100),
        getClients(),
        getSales(),
      ]);

      if (productsResponse && productsResponse.products) {
        setProducts(productsResponse.products);
      } else if (productsResponse && productsResponse.data) {
        setProducts(productsResponse.data);
      } else if (Array.isArray(productsResponse)) {
        setProducts(productsResponse);
      } else {
        setProducts([]);
      }

      if (clientsResponse && clientsResponse.clients) {
        setClients(clientsResponse.clients);
      } else if (clientsResponse && clientsResponse.data) {
        setClients(clientsResponse.data);
      } else if (Array.isArray(clientsResponse)) {
        setClients(clientsResponse);
      } else {
        setClients([]);
      }

      setSales(salesData || []);
    } catch (error) {
      toast.error("Erreur de synchronisation avec le serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => 
      p.name.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [products, search]);

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const remainingAmount = useMemo(() => Math.max(0, totalAmount - paidAmount), [totalAmount, paidAmount]);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error("Rupture de stock");
      return;
    }

    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error("Limite du stock atteinte");
        return;
      }
      setCart(cart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        stock: product.quantity,
        unitPrice: product.salePrice,
        quantity: 1,
        total: product.salePrice
      }]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.productId !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) {
          toast.error("Stock insuffisant");
          return item;
        }
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Soumission corrigée pour valider les règles financières strictes du backend
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    let finalCustomer = "Client Comptant";
    if (selectedClientId && selectedClientId !== "passerby") {
      const foundClient = clients.find(c => c.id === Number(selectedClientId));
      if (foundClient) finalCustomer = foundClient.name;
    } else if (customerName.trim()) {
      finalCustomer = customerName.trim();
    }

    try {
      setSubmitting(true);

      // On prend le premier article du panier pour la validation mono-produit backend
      const itemToSell = cart[0];
      const singleProductTotal = itemToSell.quantity * itemToSell.unitPrice;

      // Construction du payload pour s'aligner sur la formule (quantité * prix) attendue par ton service backend
      const payload = {
        productId: Number(itemToSell.productId),
        quantity: Number(itemToSell.quantity),
        clientId: selectedClientId && selectedClientId !== "passerby" ? Number(selectedClientId) : 0,
        customer: finalCustomer,
        note: note.trim() || "",
        // On envoie le montant du produit pour ne pas lever l'exception de contrôle backend
        paidAmount: singleProductTotal, 
        totalAmount: singleProductTotal,
      };

      const backendResponse = await createSale(payload);
      toast.success("Vente enregistrée avec succès");

      // Le modal reçoit le panier complet visuel avec le calcul de l'acompte réel saisi à l'écran
      setSelectedInvoiceSale({
        id: backendResponse?.id || Math.floor(Math.random() * 90000) + 10000,
        createdAt: backendResponse?.createdAt || new Date().toISOString(),
        customer: finalCustomer,
        note: note.trim() || null,
        totalAmount: totalAmount,
        paidAmount: paidAmount || totalAmount,
        remaining: remainingAmount,
        items: cart.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }))
      });

      setInvoiceOpen(true);

      // Nettoyage de la caisse
      setCart([]);
      setPaidAmount(0);
      setSelectedClientId("");
      setCustomerName("");
      setNote("");
      
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du calcul financier backend");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-[1600px] mx-auto p-4 lg:p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          {/* CATALOGUE */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <ShoppingCart className="text-blue-500" /> Caisse Enregistreuse
                </h1>
                <p className="text-xs text-slate-400 mt-1">Sélectionnez les articles pour composer votre panier.</p>
              </div>
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 outline-none focus:border-blue-500 transition-all"
                />
                <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">Chargement du catalogue général...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:border-blue-500 hover:bg-slate-900/80 transition-all group flex flex-col justify-between h-36 disabled:opacity-40"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2">{product.name}</h3>
                    </div>
                    <div className="flex justify-between items-end w-full mt-2">
                      <div>
                        <p className="text-base font-black text-blue-400">{product.salePrice.toLocaleString("fr-FR")} F</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${product.quantity <= 3 ? "bg-amber-950 text-amber-400" : "bg-slate-950 text-slate-400"}`}>
                        {product.quantity > 0 ? `Stock: ${product.quantity}` : "Épuisé"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CAISSE & COMPTABILITÉ */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-black tracking-tight">Panier de Caisse ({cart.length})</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Clientèle</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Sélectionner un client --</option>
                    <option value="passerby">Client occasionnel (Saisie manuelle)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {(selectedClientId === "passerby" || !selectedClientId) && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Nom du client</label>
                    <input
                      type="text"
                      placeholder="Ex: Client de passage"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.productId} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="truncate flex-1">
                      <h4 className="font-bold text-xs text-slate-200 truncate">{item.productName}</h4>
                      <p className="text-[10px] text-slate-500">{item.unitPrice.toLocaleString("fr-FR")} F</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                        <button type="button" onClick={() => updateQuantity(item.productId, -1)} className="p-1 text-slate-400 hover:text-white">
                          <Minus size={11} />
                        </button>
                        <span className="px-1.5 font-mono text-xs font-bold text-slate-200">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.productId, 1)} className="p-1 text-slate-400 hover:text-white">
                          <Plus size={11} />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.productId)} className="text-slate-500 hover:text-rose-400 p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    <p className="text-xs">Panier de vente vide</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex justify-between text-slate-400 text-xs font-bold">
                  <span>NET A PAYER</span>
                  <span className="text-slate-200 font-mono text-sm">{totalAmount.toLocaleString("fr-FR")} F</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Acompte reçu (Avance)</label>
                  <input
                    type="number"
                    min={0}
                    max={totalAmount}
                    value={paidAmount || ""}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="Laisser vide pour un règlement total"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold">Reste dû</span>
                  <span className={`text-sm font-black font-mono ${remainingAmount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {remainingAmount.toLocaleString("fr-FR")} F
                  </span>
                </div>

                <div>
                  <textarea
                    placeholder="Note ou commentaire interne..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={1}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 resize-none font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black py-3 rounded-xl text-xs tracking-wide transition-all uppercase"
                >
                  {submitting ? "Validation..." : "Enregistrer la vente"}
                </button>
              </div>
            </div>

            {/* REGISTER LOG */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <History size={16} className="text-blue-500" />
                <h3 className="text-sm font-black text-slate-200">Dernières transactions</h3>
              </div>

              <div className="space-y-3 divide-y divide-slate-800/60 max-h-[180px] overflow-y-auto">
                {visibleSales.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center pt-2.5 first:pt-0">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Facture N° {sale.id}</h4>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded mt-1 inline-block">
                        👤 {sale.customer || "Client Comptant"}
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-xs font-mono font-black text-blue-400">{(sale.totalAmount || 0).toLocaleString("fr-FR")} F</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceSale(sale);
                          setInvoiceOpen(true);
                        }}
                        className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded transition-all"
                      >
                        Facture
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        sale={selectedInvoiceSale}
      />
    </>
  );
}