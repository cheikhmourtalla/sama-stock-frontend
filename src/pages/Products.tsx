import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  Pencil,
  Trash2,
  Boxes,
} from "lucide-react";

import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../services/product.service";

type Product = {
  id: number;
  name: string;
  quantity: number;
  salePrice: number;
  purchasePrice: number;
  alertThreshold: number;
  description?: string | null;
};

type ProductPayload = {
  name: string;
  quantity: number;
  salePrice: number;
  purchasePrice: number;
  alertThreshold: number;
  description?: string;
};

const initialForm: ProductPayload = {
  name: "",
  quantity: 0,
  salePrice: 0,
  purchasePrice: 0,
  alertThreshold: 5,
  description: "",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<ProductPayload>(initialForm);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const data = await getProducts();

      setProducts(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();

    return products.filter((product) =>
      product.name.toLowerCase().includes(q)
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= p.alertThreshold
    ).length;

    const outOfStock = products.filter(
      (p) => p.quantity <= 0
    ).length;

    return {
      total: products.length,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity" ||
        name === "salePrice" ||
        name === "purchasePrice" ||
        name === "alertThreshold"
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      quantity: product.quantity,
      salePrice: product.salePrice,
      purchasePrice: product.purchasePrice,
      alertThreshold: product.alertThreshold,
      description: product.description || "",
    });

    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce produit ?"
    );

    if (!confirmed) return;

    try {
      await deleteProduct(id);

      toast.success("Produit supprimé avec succès");

      await fetchProducts();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.details ||
          "Erreur lors de la suppression"
      );
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      if (editingId !== null) {
        await updateProduct(editingId, form);

        toast.success(
          "Produit modifié avec succès"
        );
      } else {
        await createProduct(form);

        toast.success(
          "Produit ajouté avec succès"
        );
      }

      resetForm();

      setShowForm(false);

      await fetchProducts();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.details ||
          "Erreur lors de l'enregistrement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) =>
    `${value.toLocaleString("fr-FR")} FCFA`;

  const getStatus = (product: Product) => {
    if (product.quantity <= 0) {
      return {
        label: "Rupture",
        className:
          "bg-rose-100 text-rose-700",
      };
    }

    if (
      product.quantity <= product.alertThreshold
    ) {
      return {
        label: "Stock faible",
        className:
          "bg-orange-100 text-orange-700",
      };
    }

    return {
      label: "En stock",
      className:
        "bg-emerald-100 text-emerald-700",
    };
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        <div className="lg:col-span-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Produits
          </h1>

          <p className="text-slate-500 mt-1">
            Gérez votre catalogue et surveillez
            les niveaux de stock.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">

          <div className="bg-blue-500 p-3 rounded-xl text-white">
            <Boxes size={20} />
          </div>

          <div>
            <p className="text-xs font-bold text-blue-600 uppercase">
              Produits
            </p>

            <p className="text-xl font-black text-blue-900">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4">

          <div className="bg-orange-500 p-3 rounded-xl text-white">
            <AlertTriangle size={20} />
          </div>

          <div>
            <p className="text-xs font-bold text-orange-600 uppercase">
              Stock faible
            </p>

            <p className="text-xl font-black text-orange-900">
              {stats.lowStock}
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH + BUTTON */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-4 font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={18} />
            Ajouter produit
          </button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">

          <div className="flex items-center justify-between mb-8">

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {editingId !== null
                  ? "Modifier le produit"
                  : "Nouveau produit"}
              </h2>

              <p className="text-slate-500 mt-1">
                Remplissez les informations
                du produit.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Nom du produit
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Quantité
              </label>

              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Prix d'achat
              </label>

              <input
                type="number"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Prix de vente
              </label>

              <input
                type="number"
                name="salePrice"
                value={form.salePrice}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Seuil d'alerte
              </label>

              <input
                type="number"
                name="alertThreshold"
                value={form.alertThreshold}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

    

            <div className="md:col-span-2 flex flex-wrap gap-4 pt-2">

              <button
                type="submit"
                disabled={submitting}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-4 font-bold transition-all disabled:opacity-50"
              >
                {submitting
                  ? "Enregistrement..."
                  : editingId !== null
                  ? "Mettre à jour"
                  : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="border border-slate-200 hover:bg-slate-50 rounded-2xl px-6 py-4 font-bold text-slate-700 transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRODUCTS */}
      {loading ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center">
          <p className="text-slate-500">
            Chargement des produits...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {filteredProducts.map((product) => {
              const status = getStatus(product);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {product.name}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {product.description ||
                          "Aucune description"}
                      </p>
                    </div>

                    <div className="bg-slate-100 p-3 rounded-2xl">
                      <Package
                        size={22}
                        className="text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">

                    <div className="flex items-center justify-between">

                      <span className="text-slate-500 text-sm">
                        Stock
                      </span>

                      <span className="font-black text-slate-900">
                        {product.quantity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">

                      <span className="text-slate-500 text-sm">
                        Prix vente
                      </span>

                      <span className="font-black text-slate-900">
                        {formatCurrency(
                          product.salePrice
                        )}
                      </span>
                    </div>

                    <div className="pt-2">
                      <span
                        className={`px-3 py-2 rounded-xl text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">

                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(product)
                      }
                      className="flex-1 bg-slate-100 hover:bg-slate-200 rounded-2xl py-3 font-bold text-slate-700 flex items-center justify-center gap-2 transition-all"
                    >
                      <Pencil size={16} />
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(product.id)
                      }
                      className="flex-1 bg-rose-50 hover:bg-rose-100 rounded-2xl py-3 font-bold text-rose-600 flex items-center justify-center gap-2 transition-all"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center">
              <p className="text-slate-500">
                Aucun produit trouvé.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}