je voudrai remplaser l'affichage des prodtuit  par celui des vente (sale ) dans ce code "import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  User,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Loader2,
  Search,
  History,
} from "lucide-react";

import { getProducts } from "../services/product.service";
import { getClients } from "../services/client.service";
import { createSale, getSales } from "../services/sale.service";

type Product = {
  id: number;
  name: string;
  category?: string;
  quantity: number;
  salePrice: number;
};
type Client = { id: number; name: string; phone: string; data?: string };

type Sale = {
  id: number;
  totalAmount: number;
  remaining: number;
  createdAt: string;
};
type CartItem = {
  productId: number;
  productName: string;
  stock: number;
  quantity: number;
  unitPrice: number;
  total: number;
};

const LOGO_SRC = "."

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | 0>(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "WAVE" | "ORANGE_MONEY"
  >("CASH");
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [salesPage, setSalesPage] = useState(1);
  const [salesPagination, setSalesPagination] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsRes, clientsRes, salesRes] = await Promise.all([
        getProducts(1, 100),
        getClients(),
        getSales(salesPage, 10),
      ]);

      // PRODUITS
      setProducts(productsRes?.data || []);

      // CLIENTS
      setClients(clientsRes || []);

      console.log("PAGE :", salesPage);
      console.log("SALES RES :", salesRes);

      /**
       * IMPORTANT
       * salesRes.data = {
       *   sales: [],
       *   pagination: {}
       * }
       */

      const salesData = Array.isArray(salesRes)
        ? salesRes
        : [];

      setSales(salesData);

      setSalesPagination(
        productsRes?.pagination || {
          page: 1,
          totalPages: 1,
          total: salesData.length,
          limit: 10,
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [salesPage]);

  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.phone.includes(clientSearch),
      ),
    [clients, clientSearch],
  );

  const totalAmount: number = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.total), 0),
    [cart],
  );
  console.log(totalAmount);

  const remainingAmount: number = useMemo(
    () => Math.max(0, totalAmount - paidAmount),
    [totalAmount, paidAmount],
  );

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error("Produit en rupture");
      return;
    }
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error("Stock insuffisant");
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice,
              }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          stock: product.quantity,
          quantity: 1,
          unitPrice: product.salePrice,
          total: product.salePrice,
        },
      ]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null as any;
          if (newQty > item.stock) {
            toast.error("Stock insuffisant");
            return item;
          }
          return { ...item, quantity: newQty, total: newQty * item.unitPrice };
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const removeItem = (productId: number) =>
    setCart(cart.filter((item) => item.productId !== productId));

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Panier vide");
      return;
    }

    setSubmitting(true);
    try {
      const client = clients.find((c) => c.id === selectedClientId);
      if (selectedClientId === 0) {
        console.log(filteredClients);
        toast.error("Choisir un client");
        return;
      }
      const response = await createSale({
        items: cart,
        clientId: selectedClientId > 0 ? selectedClientId : undefined,
        paidAmount,
        paymentMethod,
      });
      setLastSale({
        id: response?.id || Math.floor(Math.random() * 99999),
        createdAt: new Date().toISOString(),
        customerName: client?.name || "Client Comptant",
        customerPhone: client?.phone || null,
        items: cart.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        totalAmount,
        paidAmount,
        remaining: remainingAmount,
      });
      setCart([]);
      setPaidAmount(0);
      setPaymentMethod("CASH");
      setSelectedClientId(0);
      setClientSearch("");
      setShowInvoice(true);
      toast.success("Vente enregistrée");
      await loadData();
    } catch {
      toast.error("Erreur lors de la vente Verifier si la caisse est ouverte");
    } finally {
      setSubmitting(false);
    }
  };

  const INVOICE_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; font-size: 13px; line-height: 1.6; }
    .iw { max-width: 820px; margin: 0 auto; padding: 48px 56px; }
    .ih { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 32px; border-bottom: 3px solid #1a1a2e; margin-bottom: 36px; }
    .logo { width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px; }
    .cn { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.3px; margin-bottom: 2px; }
    .cs { font-size: 11px; font-weight: 600; color: #9b8b6e; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 14px; }
    .cd { font-size: 11.5px; color: #555; line-height: 1.8; }
    .cd span { display: block; }
    .nb { display: inline-block; background: #f5f0e8; border: 1px solid #d4c5a9; color: #9b8b6e; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; margin-top: 4px; }
    .im { text-align: right; }
    .il { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #9b8b6e; margin-bottom: 6px; }
    .inum { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 800; color: #1a1a2e; line-height: 1; margin-bottom: 20px; }
    .mr { font-size: 12px; color: #555; margin-bottom: 4px; }
    .mr strong { color: #1a1a2e; font-weight: 600; }
    .sb { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 8px; }
    .sp { background: #e8f5f0; color: #1a8a5a; border: 1px solid #a8d8c0; }
    .su { background: #fdf0f0; color: #c0392b; border: 1px solid #f0c0c0; }
    .cs2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 36px; padding: 24px; background: #faf8f5; border-radius: 8px; border: 1px solid #e8e0d0; }
    .sl { font-size: 9.5px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #9b8b6e; margin-bottom: 8px; }
    .cname { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
    .cph { font-size: 12px; color: #666; }
    .pi { font-size: 12px; color: #555; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    thead tr { background: #1a1a2e; color: #fff; }
    thead th { padding: 13px 16px; text-align: right; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
    thead th:first-child { text-align: left; }
    tbody tr { border-bottom: 1px solid #f0ece4; }
    tbody tr:nth-child(even) { background: #faf8f5; }
    tbody td { padding: 13px 16px; font-size: 12.5px; color: #333; text-align: right; }
    tbody td:first-child { text-align: left; }
    .pn { font-weight: 600; color: #1a1a2e; }
    .qb { display: inline-block; background: #e8e0d0; color: #5a4a3a; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .ts { display: flex; justify-content: flex-end; border-top: 2px solid #1a1a2e; }
    .tb { width: 340px; padding-top: 20px; }
    .tr2 { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0ece4; font-size: 13px; }
    .trl { color: #666; }
    .trv { font-weight: 600; color: #333; }
    .gtr { display: flex; justify-content: space-between; align-items: center; padding: 16px 0 8px 0; font-size: 16px; }
    .gtl { font-family: 'Playfair Display', serif; font-weight: 700; color: #1a1a2e; }
    .gtv { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 20px; }
    .ad { color: #1a1a2e; }
    .ac { color: #c0392b; }
    .if { margin-top: 60px; padding-top: 24px; border-top: 1px solid #e8e0d0; display: flex; justify-content: space-between; align-items: flex-end; }
    .fm { font-size: 12.5px; color: #9b8b6e; font-style: italic; }
    .fb { font-family: 'Playfair Display', serif; font-size: 11px; font-weight: 600; color: #ccc; letter-spacing: 1px; text-transform: uppercase; }
    .dl { width: 40px; height: 3px; background: #9b8b6e; margin: 6px 0; }
    @media print { body { padding: 0; } @page { size: A4; margin: 0; } .iw { padding: 32px 40px; max-width: 100%; } }
  `;

  const printInvoice = () => {
    const printContents = document.getElementById("invoice-print")?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open("", "", "width=960,height=1200");
    if (!printWindow) return;
    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>Facture N°${lastSale?.id || ""}</title><style>${INVOICE_CSS}</style></head><body>${printContents}</body></html>`,
    );
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex items-center gap-3 font-bold text-stone-700">
          <Loader2 className="animate-spin" size={22} />
          Chargement...
        </div>
      </div>
    );
  }

  const createdAt = lastSale ? new Date(lastSale.createdAt) : null;
  const dateStr = createdAt ? createdAt.toLocaleDateString("fr-FR") : "";
  const timeStr = createdAt
    ? createdAt.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <>
      <div className="min-h-screen bg-stone-100">
        <div className="p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-stone-900 flex items-center gap-3">
                  <ShoppingCart className="text-amber-700" />
                  Ventes
                </h1>
                <p className="text-stone-500 mt-2">
                  Gestion des ventes et impression des factures.
                </p>
              </div>
              <div className="relative w-full lg:w-96">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 pl-11 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                />
              </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* PRODUCTS */}
              <div className="xl:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.quantity <= 0}
                      className="bg-white border border-stone-200 rounded-3xl p-5 text-left hover:border-amber-500 hover:shadow-md transition-all disabled:opacity-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-stone-900 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-xs text-stone-500 mt-1">
                            {product.category || "Général"}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-stone-100 text-stone-700">
                          {product.quantity} stock
                        </span>
                      </div>
                      <div className="mt-6 flex justify-between items-end">
                        <div>
                          <p className="text-xs text-stone-400">Prix</p>
                          <h2 className="text-xl font-black text-amber-700">
                            {product.salePrice.toLocaleString()} F
                          </h2>
                        </div>
                        <div className="bg-amber-50 text-amber-700 p-2 rounded-xl">
                          <Plus size={18} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {salesPagination && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      disabled={salesPage === 1}
                      onClick={() =>
                        setSalesPage((prev) => Math.max(prev - 1, 1))
                      }
                      className="px-5 py-3 rounded-2xl bg-white border border-stone-300 font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Précédent
                    </button>

                    <div className="px-5 py-3 bg-stone-900 text-white rounded-xl font-black">
                      {salesPagination.page} ...{salesPagination.totalPages}
                    </div>

                    <button
                      disabled={salesPage >= salesPagination.totalPages}
                      onClick={() =>
                        setSalesPage((prev) =>
                          Math.min(prev + 1, salesPagination.totalPages),
                        )
                      }
                      className="px-5 py-3 rounded-2xl bg-white border border-stone-300 font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
                {/* HISTORIQUE */}
                <div className=" hidden bg-white rounded-3xl border border-stone-200 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <History size={18} className="text-amber-700" />
                    <h3 className="font-black">Dernières ventes</h3>
                  </div>
                  <div className="space-y-4">
                    {sales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex justify-between items-center border-b border-stone-100 pb-3"
                      >
                        <div>
                          <h4 className="font-bold text-sm">
                            Facture #{sale.id}
                          </h4>
                          <p className="text-xs text-stone-500 mt-1">
                            {new Date(sale.createdAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-amber-700">
                            {sale.totalAmount.toLocaleString()} F
                          </p>
                          <span
                            className={`text-xs font-bold ${sale.remaining > 0 ? "text-red-500" : "text-emerald-500"}`}
                          >
                            {sale.remaining > 0 ? "Crédit" : "Réglé"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PANIER */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 sticky top-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-black text-stone-900">
                      Panier
                    </h2>
                    <span className="bg-stone-100 px-3 py-1 rounded-full text-xs font-black">
                      {cart.length} article(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-stone-500 flex items-center gap-2">
                      <User size={14} /> Client
                    </label>
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl px-3 py-3"
                    />
                    <select
                      value={selectedClientId}
                      onChange={(e) =>
                        setSelectedClientId(Number(e.target.value))
                      }
                      className="w-full border border-stone-200 rounded-xl px-3 py-3"
                    >
                      <option value={0}>Choisir un client</option>
                      {filteredClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 max-h-[320px] overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="border border-stone-200 rounded-2xl p-3 flex justify-between gap-3"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-sm">
                            {item.productName}
                          </h3>
                          <p className="text-xs text-stone-500 mt-1">
                            {item.unitPrice.toLocaleString()} F
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-stone-200 rounded-xl">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="p-2"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-2 font-bold text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="p-2"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="border-2 border-dashed border-stone-200 rounded-2xl p-10 text-center text-stone-500">
                        Panier vide
                      </div>
                    )}
                  </div>

                  <div className="border-t border-stone-200 pt-5 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Total</span>
                      <span className="font-black text-lg">
                        {totalAmount.toLocaleString()} F
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-stone-500">
                        Mode de paiement
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as any)
                        }
                        className="w-full border border-stone-200 rounded-xl px-3 py-3 bg-white text-stone-800 font-medium"
                      >
                        <option value="CASH">⚫ Espèces (Cash)</option>
                        <option value="WAVE">🟢 Wave</option>
                        <option value="ORANGE_MONEY">🟠 Orange Money</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-stone-500">
                        Montant payé
                      </label>
                      <input
                        type="number"
                        value={paidAmount || ""}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="w-full border border-stone-200 rounded-xl px-3 py-3"
                      />
                    </div>
                    <div className="bg-stone-100 rounded-2xl p-4 flex justify-between items-center">
                      <span className="font-bold">Reste</span>
                      <span className="font-black text-red-600">
                        {remainingAmount.toLocaleString()} F
                      </span>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || cart.length === 0}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-black"
                    >
                      {submitting ? "Traitement..." : "Valider la vente"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL */}
        {showInvoice && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-stone-900">
                  Vente enregistrée
                </h2>
                <p className="text-stone-500 mt-2">
                  Voulez-vous imprimer la facture ?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowInvoice(false)}
                  className="border border-stone-200 rounded-2xl py-3 font-bold"
                >
                  Fermer
                </button>
                <button
                  onClick={printInvoice}
                  className="bg-stone-900 text-white rounded-2xl py-3 font-black flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Imprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINT TEMPLATE */}
        {lastSale && (
          <div className="hidden">
            <div id="invoice-print">
              <div className="iw">
                {/* HEADER */}
                <div className="ih">
                  <div>
                    <img src={LOGO_SRC} alt="Logo" className="logo" />
                    <div className="cn">TOUBA PALLENE</div>
                    <div className="cs">Parfumerie · Cosmétique · Divers</div>
                    <div className="cd">
                      <span>📍 Dakar, Sénégal</span>
                      <span>📞 77 995 44 41 / 78 301 01 54</span>
                      <span className="nb">NINEA : 008036221</span>
                    </div>
                  </div>
                  <div className="im">
                    <div className="il">Facture</div>
                    <div className="inum">#{lastSale.id}</div>
                    <div className="mr">
                      Date : <strong>{dateStr}</strong>
                    </div>
                    <div className="mr">
                      Heure : <strong>{timeStr}</strong>
                    </div>
                    <div
                      className={`sb ${lastSale.remaining > 0 ? "su" : "sp"}`}
                    >
                      {lastSale.remaining > 0 ? "⚠ Non réglée" : "✓ Payée"}
                    </div>
                  </div>
                </div>

                {/* CLIENT INFO */}
                <div className="cs2">
                  <div>
                    <div className="sl">Facturé à</div>
                    <div className="cname">{lastSale.customerName}</div>
                    {lastSale.customerPhone && (
                      <div className="cph">📞 {lastSale.customerPhone}</div>
                    )}
                  </div>
                  <div>
                    <div className="sl">Informations de paiement</div>
                    <div className="pi">
                      <div>
                        Total :{" "}
                        <strong>
                          {lastSale.totalAmount.toLocaleString()} FCFA
                        </strong>
                      </div>
                      <div>
                        Versé :{" "}
                        <strong>
                          {lastSale.paidAmount.toLocaleString()} FCFA
                        </strong>
                      </div>
                      {lastSale.remaining > 0 && (
                        <div style={{ color: "#c0392b", fontWeight: 700 }}>
                          Reste dû : {lastSale.remaining.toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* TABLE */}
                <table>
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th style={{ width: "80px" }}>Qté</th>
                      <th style={{ width: "140px" }}>Prix unit.</th>
                      <th style={{ width: "150px" }}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSale.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="pn">{item.name}</td>
                        <td>
                          <span className="qb">{item.quantity}</span>
                        </td>
                        <td>{item.unitPrice.toLocaleString()} F</td>
                        <td style={{ fontWeight: 700, color: "#1a1a2e" }}>
                          {item.total.toLocaleString()} F
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* TOTALS */}
                <div className="ts">
                  <div className="tb">
                    <div className="tr2">
                      <span className="trl">Sous-total</span>
                      <span className="trv">
                        {lastSale.totalAmount.toLocaleString()} F
                      </span>
                    </div>
                    <div className="tr2">
                      <span className="trl">Montant versé</span>
                      <span className="trv">
                        {lastSale.paidAmount.toLocaleString()} F
                      </span>
                    </div>
                    <div className="gtr">
                      <span className="gtl">
                        {lastSale.remaining > 0
                          ? "Reste à payer"
                          : "Net à payer"}
                      </span>
                      <span
                        className={`gtv ${lastSale.remaining > 0 ? "ac" : "ad"}`}
                      >
                        {lastSale.remaining > 0
                          ? `${lastSale.remaining.toLocaleString()} F`
                          : `${lastSale.totalAmount.toLocaleString()} F`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="if">
                  <div>
                    <div className="dl"></div>
                    <div className="fm">
                      Merci de votre confiance et à bientôt !
                    </div>
                  </div>
                  <div className="fb">Touba Pallene Thiouraye</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} " , je veu que tu me redonne le code complet avec ces changement . ne toche rien en dehord de ces  affchage . voici un example de sortie . sale:[.........,  {
        id: 37,
        productId: 6,
        clientId: 3,
        quantity: 1,
        unitPrice: '211',
        totalAmount: '211',
        paidAmount: '0',
        remaining: '211',
        customer: 'test13',
        note: null,
        createdAt: '2026-05-21T22:38:25.285Z',
        product: {
          id: 6,
          supplier_id: null,
          name: 'wdq',
          description: '',
          quantity: 27,
          purchasePrice: '922',
          salePrice: '211',
          alertThreshold: 5,
          createdAt: '2026-05-21T17:23:03.250Z',
          updatedAt: '2026-05-21T22:38:25.284Z'
        },
        client: {
          id: 3,
          name: 'test13',
          phone: '778096713',
          createdAt: '2026-05-21T11:40:52.003Z'
        }
      },
      {
        id: 36,
        productId: 4,
        clientId: 3,
        quantity: 1,
        unitPrice: '110',
        totalAmount: '110',
        paidAmount: '0',
        remaining: '110',
        customer: 'test13',
        note: null,
        createdAt: '2026-05-21T22:37:56.698Z',
        product: {
          id: 4,
          supplier_id: null,
          name: 'test',
          description: '',
          quantity: 109,
          purchasePrice: '110',
          salePrice: '110',
          alertThreshold: 5,
          createdAt: '2026-05-21T17:22:21.380Z',
          updatedAt: '2026-05-21T22:37:56.697Z'
        },
        client: {
          id: 3,
          name: 'test13',
          phone: '778096713',
          createdAt: '2026-05-21T11:40:52.003Z'
        }
      },
      {
        id: 35,
        productId: 8,
        clientId: 3,
        quantity: 1,
        unitPrice: '100',
        totalAmount: '100',
        paidAmount: '0',
        remaining: '100',
        customer: 'test13',
        note: null,
        createdAt: '2026-05-21T22:37:56.683Z',
        product: {
          id: 8,
          supplier_id: null,
          name: 'mango',
          description: '',
          quantity: 98,
          purchasePrice: '1000',
          salePrice: '100',
          alertThreshold: 5,
          createdAt: '2026-05-21T17:23:40.734Z',
          updatedAt: '2026-05-22T07:28:51.647Z'
        },
        client: {
          id: 3,
          name: 'test13',
          phone: '778096713',
          createdAt: '2026-05-21T11:40:52.003Z'
        }
      },
      {
        id: 34,
        productId: 7,
        clientId: 3,
        quantity: 1,
        unitPrice: '0',
        totalAmount: '0',
        paidAmount: '0',
        remaining: '0',
        customer: 'test13',
        note: null,
        createdAt: '2026-05-21T22:37:56.662Z',
        product: {
          id: 7,
          supplier_id: null,
          name: 'qwer',
          description: '',
          quantity: 13,
          purchasePrice: '110',
          salePrice: '0',
          alertThreshold: 5,
          createdAt: '2026-05-21T17:23:22.859Z',
          updatedAt: '2026-05-21T22:38:25.292Z'
        },
        client: {
          id: 3,
          name: 'test13',
          phone: '778096713',
          createdAt: '2026-05-21T11:40:52.003Z'
        }
      },
      {
        id: 33,
        productId: 6,
        clientId: 3,
        quantity: 1,
        unitPrice: '211',
        totalAmount: '211',
        paidAmount: '0',
        remaining: '211',
        customer: 'test13',
        note: null,
        createdAt: '2026-05-21T22:37:56.567Z',
        product: {
          id: 6,
          supplier_id: null,
          name: 'wdq',
          description: '',
          quantity: 27,
          purchasePrice: '922',
          salePrice: '211',
          alertThreshold: 5,
          createdAt: '2026-05-21T17:23:03.250Z',
          updatedAt: '2026-05-21T22:38:25.284Z'
        },
        client: {
          id: 3,
          name: 'test13',
          phone: '778096713',
          createdAt: '2026-05-21T11:40:52.003Z'
        }
      },
      {
        id: 32,
        productId: 6,
        clientId: null,
        quantity: 1,
        unitPrice: '211',
        totalAmount: '211',
        paidAmount: '0',
        remaining: '211',
        customer: 'Client Comptant',
        note: null,
        createdAt: '2026-05-21T18:14:43.511Z',
        product: {
          id: 6,
          supplier_id: null,
          name: 'wdq',
          description: '',
          quantity: 27,
          purchasePrice: '922',
          salePrice: '211',
          alertThreshold: 5,
          createdAt: '2026-05-21T17:23:03.250Z',
          updatedAt: '2026-05-21T22:38:25.284Z'
        },
        client: null
      },
      {
        id: 31,
        productId: 9,
        clientId: null,
        quantity: 1,
        unitPrice: '0',
        totalAmount: '0',
        paidAmount: '0',
        remaining: '0',
        customer: 'Client Comptant',
        note: null,
        createdAt: '2026-05-21T18:13:33.980Z',
        product: {
          id: 9,
          supplier_id: null,
          name: 'test1e',
          description: '',
          quantity: 7,
          purchasePrice: '0',
          salePrice: '0',
          alertThreshold: 5,
          createdAt: '2026-05-21T17:23:50.503Z',
          updatedAt: '2026-05-21T18:13:33.976Z'
        },
        client: null
      }
    ],
    pagination: { page: 1, limit: 10, total: 40, totalPages: 4 }
  }]