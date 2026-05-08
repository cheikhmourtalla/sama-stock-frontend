import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getClients } from "../services/client.service";
import { getProducts } from "../services/product.service";
import { createSale, getSales } from "../services/sale.service";

type Product = {
  id: number;
  name: string;
  category?: string;
  reference?: string;
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
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  createdAt: string;
  customer?: string | null;
  product?: {
    id: number;
    name: string;
  };
  client?: {
    id: number;
    name: string;
  };
};

type CartItem = {
  productId: number;
  productName: string;
  stock: number;
  unitPrice: number;
  quantity: number;
  total: number;
};

type SalePayload = {
  productId: number;
  clientId?: number;
  quantity: number;
  paidAmount?: number;
  customer?: string;
};

type InvoiceData = {
  invoiceNumber: string;
  clientName: string;
  createdAt: string;
  items: CartItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [clientId, setClientId] = useState<number>(0);
  const [customerName, setCustomerName] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const [showAllHistory, setShowAllHistory] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [productsData, clientsData, salesData] = await Promise.all([
        getProducts(),
        getClients(),
        getSales(),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : productsData?.data || []);
      setClients(clientsData || []);
      setSales(salesData || []);
    } catch (error) {
      console.error("Erreur chargement ventes", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => product.quantity > 0)
      .filter((product) => {
        if (!q) return true;

        return (
          product.name.toLowerCase().includes(q) ||
          (product.category || "").toLowerCase().includes(q) ||
          (product.reference || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [products, searchTerm]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => product.quantity > 0).slice(0, 8);
  }, [products]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const remainingAmount = useMemo(() => {
    const remaining = totalAmount - Number(paidAmount || 0);
    return remaining > 0 ? remaining : 0;
  }, [totalAmount, paidAmount]);

  const totalSalesAmount = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [sales]);

  const totalPaidSales = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  }, [sales]);

  const totalRemainingSales = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.remaining, 0);
  }, [sales]);

  const recentSales = useMemo(() => {
    return showAllHistory ? sales : sales.slice(0, 5);
  }, [sales, showAllHistory]);

  const formatCurrency = (value: number) =>
    `${value.toLocaleString("fr-FR")} FCFA`;

  const resetForm = () => {
    setSearchTerm("");
    setSelectedProductId(0);
    setSelectedQuantity(1);
    setClientId(0);
    setCustomerName("");
    setPaidAmount(0);
    setCart([]);
    setShowSearchResults(false);
  };

  const selectProductFromSearch = (product: Product) => {
    setSelectedProductId(product.id);
    setSearchTerm(product.name);
    setShowSearchResults(false);
  };

  const selectProductCard = (product: Product) => {
    setSelectedProductId(product.id);
    setSearchTerm(product.name);
  };

  const incrementSelectedQuantity = () => {
    if (!selectedProduct) {
      setSelectedQuantity((prev) => prev + 1);
      return;
    }

    setSelectedQuantity((prev) =>
      prev + 1 > selectedProduct.quantity ? selectedProduct.quantity : prev + 1
    );
  };

  const decrementSelectedQuantity = () => {
    setSelectedQuantity((prev) => (prev - 1 < 1 ? 1 : prev - 1));
  };

  const addToCart = () => {
    if (!selectedProduct) {
      toast.error("Veuillez sélectionner un produit");
      return;
    }

    const qty = Number(selectedQuantity);

    if (!qty || qty <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    const existingInCart = cart.find((item) => item.productId === selectedProduct.id);
    const alreadySelected = existingInCart ? existingInCart.quantity : 0;

    if (qty + alreadySelected > selectedProduct.quantity) {
      toast.error("Quantité supérieure au stock disponible");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === selectedProduct.id);

      if (existing) {
        return prev.map((item) =>
          item.productId === selectedProduct.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                total: (item.quantity + qty) * item.unitPrice,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          stock: selectedProduct.quantity,
          unitPrice: Number(selectedProduct.salePrice),
          quantity: qty,
          total: Number(selectedProduct.salePrice) * qty,
        },
      ];
    });

    setSelectedProductId(0);
    setSelectedQuantity(1);
    setSearchTerm("");
    setShowSearchResults(false);
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const incrementCartQuantity = (productId: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const newQty = item.quantity + 1 > item.stock ? item.stock : item.quantity + 1;

        return {
          ...item,
          quantity: newQty,
          total: newQty * item.unitPrice,
        };
      })
    );
  };

  const decrementCartQuantity = (productId: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const newQty = item.quantity - 1 < 1 ? 1 : item.quantity - 1;

        return {
          ...item,
          quantity: newQty,
          total: newQty * item.unitPrice,
        };
      })
    );
  };

  const buildInvoiceNumber = () => {
    const now = new Date();
    return `FAC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}-${now.getTime().toString().slice(-5)}`;
  };

  const handlePrintInvoice = () => {
    if (!invoiceRef.current) return;

    const printContent = invoiceRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Facture SamaStock</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: white;
              color: #111827;
              padding: 32px;
            }
            .invoice-wrapper {
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
              margin-bottom: 28px;
              border-bottom: 2px solid #111827;
              padding-bottom: 18px;
            }
            .brand h1 {
              margin: 0;
              font-size: 30px;
            }
            .brand p {
              margin: 6px 0 0;
              color: #6b7280;
            }
            .meta {
              text-align: right;
            }
            .meta p {
              margin: 4px 0;
            }
            .client-box {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 16px;
              margin-bottom: 22px;
              background: #f9fafb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background: #f3f4f6;
            }
            .footer {
              margin-top: 28px;
              color: #6b7280;
              font-size: 13px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Ajoutez au moins un article");
      return;
    }

    if (clientId === 0 && !customerName.trim()) {
      toast.error("Veuillez renseigner un client ou un nom");
      return;
    }

    if (Number(paidAmount) < 0) {
      toast.error("Le montant payé est invalide");
      return;
    }

    if (Number(paidAmount) > totalAmount) {
      toast.error("Le montant payé ne peut pas dépasser le total");
      return;
    }

    setSubmitting(true);

    try {
      let remainingPaidToDistribute = Number(paidAmount);

      for (const item of cart) {
        const lineTotal = item.total;
        const linePaid =
          remainingPaidToDistribute >= lineTotal
            ? lineTotal
            : remainingPaidToDistribute;

        const payload: SalePayload = {
          productId: item.productId,
          quantity: item.quantity,
          paidAmount: linePaid,
        };

        if (clientId !== 0) {
          payload.clientId = clientId;
        } else {
          payload.customer = customerName.trim();
        }

        await createSale(payload);
        remainingPaidToDistribute -= linePaid;
      }

      const clientName =
        clientId !== 0
          ? clients.find((client) => client.id === clientId)?.name || "Client"
          : customerName.trim();

      setInvoiceData({
        invoiceNumber: buildInvoiceNumber(),
        clientName,
        createdAt: new Date().toISOString(),
        items: [...cart],
        totalAmount,
        paidAmount: Number(paidAmount),
        remainingAmount,
      });

      setShowInvoice(true);
      toast.success("Vente enregistrée avec succès");
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error("Erreur enregistrement vente", error);
      toast.error(
        error?.response?.data?.message || "Erreur lors de l'enregistrement de la vente"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Ventes</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enregistrez plusieurs articles, encaissez un acompte et générez une facture.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Montant total vendu</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalSalesAmount)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Montant encaissé</p>
          <h3 className="mt-2 text-2xl font-bold text-green-700">
            {formatCurrency(totalPaidSales)}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Reste à encaisser</p>
          <h3 className="mt-2 text-2xl font-bold text-red-700">
            {formatCurrency(totalRemainingSales)}
          </h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Informations client</h3>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Client enregistré
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value={0}>Client non enregistré</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nom du client
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={clientId !== 0}
                placeholder="Ex: Client boutique"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
  <h3 className="text-xl font-bold text-slate-900">Ajouter des articles</h3>
  <p className="mt-1 text-sm text-gray-500">
    Sélectionnez directement un produit puis ajoutez la quantité souhaitée.
  </p>

  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Produit
      </label>
      <select
        value={selectedProductId}
        onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedProductId(id);

          const foundProduct = products.find((p) => p.id === id);
          if (foundProduct) {
            setSearchTerm(foundProduct.name);
          } else {
            setSearchTerm("");
          }
        }}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
      >
        <option value={0}>Sélectionner un produit</option>
        {products
          .filter((product) => product.quantity > 0)
          .map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - {formatCurrency(Number(product.salePrice))} - Stock {product.quantity}
            </option>
          ))}
      </select>
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Produit sélectionné
      </label>
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        {selectedProduct ? (
          <>
            <p className="font-medium text-slate-900">{selectedProduct.name}</p>
            <p className="text-sm text-gray-500">
              {formatCurrency(Number(selectedProduct.salePrice))} • Stock {selectedProduct.quantity}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Aucun produit sélectionné</p>
        )}
      </div>
    </div>
  </div>

  <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end">
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Quantité
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrementSelectedQuantity}
          className="rounded-xl border border-gray-300 px-4 py-3 text-lg font-bold text-slate-700 hover:bg-gray-50"
        >
          -
        </button>

        <input
          type="number"
          min={1}
          value={selectedQuantity}
          onChange={(e) =>
            setSelectedQuantity(
              Number(e.target.value) < 1 ? 1 : Number(e.target.value)
            )
          }
          className="w-24 rounded-xl border border-gray-300 px-4 py-3 text-center outline-none focus:border-slate-900"
        />

        <button
          type="button"
          onClick={incrementSelectedQuantity}
          className="rounded-xl border border-gray-300 px-4 py-3 text-lg font-bold text-slate-700 hover:bg-gray-50"
        >
          +
        </button>
      </div>
    </div>

    <button
      type="button"
      onClick={addToCart}
      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:opacity-90"
    >
      Ajouter l’article
    </button>
  </div>
</div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">Panier</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {cart.length} article{cart.length > 1 ? "s" : ""}
            </span>
          </div>

          {cart.length === 0 ? (
            <p className="mt-4 text-gray-500">Aucun article ajouté.</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="pb-3">Produit</th>
                    <th className="pb-3">Prix unitaire</th>
                    <th className="pb-3">Quantité</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.productId} className="border-b">
                      <td className="py-4 font-medium text-slate-900">
                        {item.productName}
                      </td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decrementCartQuantity(item.productId)}
                            className="rounded-lg border border-gray-300 px-3 py-2 font-bold text-slate-700 hover:bg-gray-50"
                          >
                            -
                          </button>

                          <div className="min-w-[56px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center font-medium">
                            {item.quantity}
                          </div>

                          <button
                            type="button"
                            onClick={() => incrementCartQuantity(item.productId)}
                            className="rounded-lg border border-gray-300 px-3 py-2 font-bold text-slate-700 hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="font-semibold">{formatCurrency(item.total)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Résumé de paiement</h3>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Montant total
              </label>
              <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-slate-900">
                {formatCurrency(totalAmount)}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Montant payé
              </label>
              <input
                type="number"
                min={0}
                max={totalAmount}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reste à payer
              </label>
              <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-red-700">
                {formatCurrency(remainingAmount)}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Enregistrement..." : "Enregistrer la vente"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900">Ventes récentes</h3>

          {sales.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllHistory((prev) => !prev)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50"
            >
              {showAllHistory ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>

        {loading ? (
          <p className="mt-4">Chargement...</p>
        ) : recentSales.length === 0 ? (
          <p className="mt-4 text-gray-500">Aucune vente enregistrée.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3">Produit</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Qté</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Payé</th>
                  <th className="pb-3">Reste</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b">
                    <td className="py-4 font-medium text-slate-900">
                      {sale.product?.name || "-"}
                    </td>
                    <td>{sale.client?.name || sale.customer || "-"}</td>
                    <td>{sale.quantity}</td>
                    <td>{formatCurrency(sale.totalAmount)}</td>
                    <td className="text-green-700">
                      {formatCurrency(sale.paidAmount)}
                    </td>
                    <td className="font-semibold text-red-700">
                      {formatCurrency(sale.remaining)}
                    </td>
                    <td>{new Date(sale.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInvoice && invoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Facture client</h3>
                <p className="text-sm text-gray-500">
                  Document de vente généré automatiquement
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Imprimer
                </button>

                <button
                  type="button"
                  onClick={() => setShowInvoice(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>

            <div className="p-6">
              <div ref={invoiceRef} className="invoice-wrapper">
                <div className="header flex flex-col gap-6 border-b border-slate-900 pb-6 md:flex-row md:items-start md:justify-between">
                  <div className="brand">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      SamaStock
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Gestion intelligente des ventes et du stock
                    </p>
                  </div>

                  <div className="meta rounded-2xl border border-gray-200 bg-slate-50 p-4 md:min-w-[280px]">
                    <p className="text-sm text-gray-500">Numéro de facture</p>
                    <p className="text-lg font-bold text-slate-900">
                      {invoiceData.invoiceNumber}
                    </p>

                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <p className="text-sm text-gray-500">Date d’émission</p>
                      <p className="font-medium text-slate-900">
                        {new Date(invoiceData.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-medium text-gray-500">Facturé à</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {invoiceData.clientName}
                  </p>
                </div>

                <div className="mt-8 overflow-x-auto">
                  <table className="w-full border-collapse overflow-hidden rounded-2xl border border-gray-200">
                    <thead>
                      <tr className="bg-slate-100 text-sm text-gray-600">
                        <th className="px-4 py-3 text-left">Produit</th>
                        <th className="px-4 py-3 text-left">Prix unitaire</th>
                        <th className="px-4 py-3 text-left">Quantité</th>
                        <th className="px-4 py-3 text-left">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item) => (
                        <tr key={item.productId} className="border-t border-gray-200">
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-4">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-4">{item.quantity}</td>
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-10 rounded-2xl bg-slate-50 p-4 text-center text-sm text-gray-500">
                  Merci pour votre confiance.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}