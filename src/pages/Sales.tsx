import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Package,
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

// ======================================================
// TYPES
// ======================================================
type Product = {
  id: number;
  name: string;
  category?: string;
  quantity: number;
  salePrice: number;
};

type Client = {
  id: number;
  name: string;
  phone: string;
};

type Sale = {
  id: number;
  totalAmount: number;
  remaining: number;
  createdAt: string;
  client?: {
    name: string;
  };
};

type CartItem = {
  productId: number;
  productName: string;
  stock: number;
  quantity: number;
  unitPrice: number;
  total: number;
};

export default function Sales() {

  // ======================================================
  // STATES
  // ======================================================
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

  const [showInvoice, setShowInvoice] = useState(false);

  const [lastSale, setLastSale] = useState<any>(null);

  // ======================================================
  // LOAD DATA
  // ======================================================
  const loadData = async () => {
    try {

      setLoading(true);

      const [productsRes, clientsRes, salesRes] =
        await Promise.all([
          getProducts("", "", 1, 100),
          getClients(),
          getSales().catch(() => []),
        ]);

      setProducts(
        productsRes?.products ||
        productsRes?.data?.products ||
        productsRes?.data ||
        []
      );

      setClients(
        clientsRes?.data ||
        clientsRes ||
        []
      );

      setSales(
        salesRes?.data ||
        salesRes ||
        []
      );

    } catch (error) {

      toast.error("Erreur de chargement");

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ======================================================
  // FILTER PRODUCTS
  // ======================================================
  const filteredProducts = useMemo(() => {

    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

  }, [products, search]);

  // ======================================================
  // FILTER CLIENTS
  // ======================================================
  const filteredClients = useMemo(() => {

    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phone.includes(clientSearch)
    );

  }, [clients, clientSearch]);

  // ======================================================
  // TOTALS
  // ======================================================
  const totalAmount = useMemo(() => {

    return cart.reduce((sum, item) => sum + item.total, 0);

  }, [cart]);

  const remainingAmount = useMemo(() => {

    return Math.max(0, totalAmount - paidAmount);

  }, [totalAmount, paidAmount]);

  // ======================================================
  // ADD TO CART
  // ======================================================
  const addToCart = (product: Product) => {

    if (product.quantity <= 0) {
      toast.error("Produit en rupture");
      return;
    }

    const existing = cart.find(
      (item) => item.productId === product.id
    );

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
                total:
                  (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
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

  // ======================================================
  // UPDATE QUANTITY
  // ======================================================
  const updateQuantity = (
    productId: number,
    delta: number
  ) => {

    setCart(
      cart
        .map((item) => {

          if (item.productId !== productId)
            return item;

          const newQty = item.quantity + delta;

          if (newQty <= 0) return null;

          if (newQty > item.stock) {
            toast.error("Stock insuffisant");
            return item;
          }

          return {
            ...item,
            quantity: newQty,
            total: newQty * item.unitPrice,
          };

        })
        .filter(Boolean) as CartItem[]
    );
  };

  // ======================================================
  // REMOVE ITEM
  // ======================================================
  const removeItem = (productId: number) => {

    setCart(
      cart.filter(
        (item) => item.productId !== productId
      )
    );
  };

  // ======================================================
  // SUBMIT SALE
  // ======================================================
  const handleSubmit = async () => {

    if (cart.length === 0) {
      toast.error("Panier vide");
      return;
    }

    setSubmitting(true);

    try {

      const client = clients.find(
        (c) => c.id === selectedClientId
      );

      const firstItem = cart[0];

      const payload = {
        productId: firstItem.productId,
        quantity: firstItem.quantity,
        clientId:
          selectedClientId > 0
            ? selectedClientId
            : undefined,
        paidAmount,
      };

      const response = await createSale(payload);

      setLastSale({
        id:
          response?.id ||
          Math.floor(Math.random() * 99999),

        createdAt: new Date().toISOString(),

        customerName:
          client?.name || "Client Comptant",

        items: cart.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),

        totalAmount,
        paidAmount,
        remaining: remainingAmount,
      });

      setCart([]);
      setPaidAmount(0);
      setSelectedClientId(0);
      setClientSearch("");

      setShowInvoice(true);

      toast.success("Vente enregistrée");

      await loadData();

    } catch (error) {

      toast.error("Erreur lors de la vente");

    } finally {

      setSubmitting(false);

    }
  };

  // ======================================================
  // PRINT
  // ======================================================
  const printInvoice = () => {
    window.print();
  };

  // ======================================================
  // LOADING
  // ======================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 font-bold text-slate-700">
          <Loader2 className="animate-spin" size={22} />
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 print:bg-white">

      <div className="max-w-[1600px] mx-auto space-y-8 print:hidden">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <ShoppingCart className="text-blue-600" />
              Caisse
            </h1>

            <p className="text-slate-500 mt-2">
              Gérez vos ventes et imprimez les factures.
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative w-full lg:w-96">

            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 pl-11 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ================================================= */}
          {/* PRODUCTS */}
          {/* ================================================= */}
          <div className="xl:col-span-2">

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {filteredProducts.map((product) => (

                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.quantity <= 0}
                  className="bg-white border border-slate-200 rounded-3xl p-5 text-left hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50"
                >

                  <div className="flex justify-between items-start">

                    <div>
                      <h3 className="font-black text-slate-900 line-clamp-2">
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        {product.category || "Général"}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        product.quantity <= 5
                          ? "bg-orange-100 text-orange-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {product.quantity} en stock
                    </span>
                  </div>

                  <div className="mt-6 flex justify-between items-end">

                    <div>
                      <p className="text-xs text-slate-400">
                        Prix
                      </p>

                      <h2 className="text-xl font-black text-blue-600">
                        {product.salePrice.toLocaleString()} F
                      </h2>
                    </div>

                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                      <Plus size={18} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ================================================= */}
          {/* CART */}
          {/* ================================================= */}
          <div className="space-y-6">

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 sticky top-6">

              <div className="flex items-center justify-between">

                <h2 className="text-lg font-black text-slate-900">
                  Panier
                </h2>

                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-black text-slate-700">
                  {cart.length} article(s)
                </span>
              </div>

              {/* CLIENT */}
              <div className="space-y-3">

                <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                  <User size={14} />
                  Client
                </label>

                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={clientSearch}
                  onChange={(e) =>
                    setClientSearch(e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                  value={selectedClientId}
                  onChange={(e) =>
                    setSelectedClientId(
                      Number(e.target.value)
                    )
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>
                    Client comptant
                  </option>

                  {filteredClients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name} ({client.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* CART ITEMS */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto">

                {cart.map((item) => (

                  <div
                    key={item.productId}
                    className="border border-slate-200 rounded-2xl p-3 flex justify-between gap-3"
                  >

                    <div className="flex-1">

                      <h3 className="font-bold text-sm text-slate-900">
                        {item.productName}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        {item.unitPrice.toLocaleString()} F
                      </p>
                    </div>

                    <div className="flex items-center gap-2">

                      <div className="flex items-center border border-slate-200 rounded-xl">

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              -1
                            )
                          }
                          className="p-2"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="px-2 font-bold text-sm">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              1
                            )
                          }
                          className="p-2"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          removeItem(item.productId)
                        }
                        className="text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
                    Panier vide
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="border-t border-slate-200 pt-5 space-y-4">

                <div className="flex justify-between text-sm">

                  <span className="text-slate-500">
                    Total
                  </span>

                  <span className="font-black text-lg text-slate-900">
                    {totalAmount.toLocaleString()} F
                  </span>
                </div>

                {/* PAID */}
                <div className="space-y-2">

                  <label className="text-xs font-bold uppercase text-slate-500">
                    Montant payé
                  </label>

                  <input
                    type="number"
                    value={paidAmount || ""}
                    onChange={(e) =>
                      setPaidAmount(
                        Number(e.target.value)
                      )
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* REMAINING */}
                <div className="bg-slate-100 rounded-2xl p-4 flex justify-between items-center">

                  <span className="font-bold text-slate-700">
                    Reste
                  </span>

                  <span className="font-black text-lg text-rose-600">
                    {remainingAmount.toLocaleString()} F
                  </span>
                </div>

                {/* BUTTON */}
                <button
                  onClick={handleSubmit}
                  disabled={
                    submitting || cart.length === 0
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-50"
                >
                  {submitting
                    ? "Traitement..."
                    : "Valider la vente"}
                </button>
              </div>
            </div>

            {/* ================================================= */}
            {/* SALES HISTORY */}
            {/* ================================================= */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6">

              <div className="flex items-center gap-2 mb-5">

                <History
                  size={18}
                  className="text-blue-600"
                />

                <h3 className="font-black text-slate-900">
                  Dernières ventes
                </h3>
              </div>

              <div className="space-y-4">

                {sales.slice(0, 5).map((sale) => (

                  <div
                    key={sale.id}
                    className="flex justify-between items-center border-b border-slate-100 pb-3"
                  >

                    <div>

                      <h4 className="font-bold text-sm text-slate-900">
                        Facture #{sale.id}
                      </h4>

                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(
                          sale.createdAt
                        ).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    <div className="text-right">

                      <p className="font-black text-blue-600">
                        {sale.totalAmount.toLocaleString()} F
                      </p>

                      <span
                        className={`text-xs font-bold ${
                          sale.remaining > 0
                            ? "text-rose-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {sale.remaining > 0
                          ? "Crédit"
                          : "Réglé"}
                      </span>
                    </div>
                  </div>
                ))}

                {sales.length === 0 && (
                  <div className="text-center text-slate-500 py-6">
                    Aucune vente
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* SUCCESS MODAL */}
      {/* ================================================= */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">

          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6">

            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 size={30} />
            </div>

            <div>

              <h2 className="text-2xl font-black text-slate-900">
                Vente enregistrée
              </h2>

              <p className="text-slate-500 mt-2">
                Voulez-vous imprimer la facture ?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <button
                onClick={() =>
                  setShowInvoice(false)
                }
                className="border border-slate-200 rounded-2xl py-3 font-bold"
              >
                Fermer
              </button>

              <button
                onClick={printInvoice}
                className="bg-slate-900 text-white rounded-2xl py-3 font-black flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* PRINTABLE INVOICE */}
      {/* ================================================= */}
      {lastSale && (

        <div className="hidden print:block bg-white text-black min-h-screen p-10">

          <div className="max-w-3xl mx-auto">

            {/* HEADER */}
            <div className="flex justify-between border-b-2 border-black pb-6">

              <div>

                <h1 className="text-3xl font-black">
                  TOUBA PALLENE
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  Vente de parfums et produits divers
                </p>

                <p className="text-sm mt-4">
                  Dakar - Sénégal
                </p>

                <p className="text-sm">
                  +221 77 995 44 41
                </p>
              </div>

              <div className="text-right">

                <h2 className="text-3xl font-black uppercase">
                  Facture
                </h2>

                <div className="mt-4 text-sm space-y-1">

                  <p>
                    <span className="font-bold">
                      Facture :
                    </span>{" "}
                    #{lastSale.id}
                  </p>

                  <p>
                    <span className="font-bold">
                      Date :
                    </span>{" "}
                    {new Date(
                      lastSale.createdAt
                    ).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </div>

            {/* CLIENT */}
            <div className="mt-8">

              <p className="uppercase text-xs font-bold text-slate-500">
                Client
              </p>

              <h3 className="text-xl font-black mt-2">
                {lastSale.customerName}
              </h3>
            </div>

            {/* TABLE */}
            <div className="mt-10">

              <table className="w-full">

                <thead>

                  <tr className="border-b-2 border-black">

                    <th className="text-left py-4 uppercase text-sm">
                      Produit
                    </th>

                    <th className="text-center py-4 uppercase text-sm">
                      Qté
                    </th>

                    <th className="text-right py-4 uppercase text-sm">
                      Prix
                    </th>

                    <th className="text-right py-4 uppercase text-sm">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {lastSale.items.map(
                    (item: any, index: number) => (

                      <tr
                        key={index}
                        className="border-b border-slate-200"
                      >

                        <td className="py-5">
                          {item.name}
                        </td>

                        <td className="text-center py-5">
                          {item.quantity}
                        </td>

                        <td className="text-right py-5">
                          {item.unitPrice.toLocaleString()} F
                        </td>

                        <td className="text-right py-5 font-bold">
                          {(
                            item.quantity *
                            item.unitPrice
                          ).toLocaleString()}{" "}
                          F
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* TOTALS */}
            <div className="flex justify-end mt-10">

              <div className="w-80 space-y-4">

                <div className="flex justify-between">
                  <span>Total</span>

                  <span className="font-bold">
                    {lastSale.totalAmount.toLocaleString()} F
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Montant payé</span>

                  <span className="font-bold">
                    {lastSale.paidAmount.toLocaleString()} F
                  </span>
                </div>

                <div className="flex justify-between border-t-2 border-black pt-4 text-lg font-black">

                  <span>Reste</span>

                  <span>
                    {lastSale.remaining.toLocaleString()} F
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-24 border-t pt-6 text-center">

              <p className="text-lg font-bold">
                Merci pour votre confiance
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Facture générée par SamaStock
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}