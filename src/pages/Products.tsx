import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
        error?.response?.data?.message ||
          "Erreur lors de la suppression du produit"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId !== null) {
        await updateProduct(editingId, form);
        toast.success("Produit modifié avec succès");
      } else {
        await createProduct(form);
        toast.success("Produit ajouté avec succès");
      }

      resetForm();
      setShowForm(false);
      await fetchProducts();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors de l'enregistrement du produit"
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
        className: "bg-red-100 text-red-700",
      };
    }

    if (product.quantity <= product.alertThreshold) {
      return {
        label: "Stock faible",
        className: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "En stock",
      className: "bg-green-100 text-green-700",
    };
  };

  return (
    <section className="space-y-6">
  

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Liste des produits
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les produits enregistrés dans SamaStock.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Ajouter produit
          </button>
        </div>

        <div className="mt-6">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-slate-900">
            {editingId !== null ? "Modifier le produit" : "Nouveau produit"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nom du produit
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Quantité
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Prix d’achat
              </label>
              <input
                type="number"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Prix de vente
              </label>
              <input
                type="number"
                name="salePrice"
                value={form.salePrice}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Seuil d’alerte
              </label>
              <input
                type="number"
                name="alertThreshold"
                value={form.alertThreshold}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Image
              </label>
              <input
                type="text"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="URL image"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="min-h-[110px] w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {submitting
                  ? "Enregistrement..."
                  : editingId !== null
                  ? "Mettre à jour"
                  : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Réinitialiser
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="pb-3">Nom</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3">Prix vente</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const status = getStatus(product);

                    return (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 font-medium text-slate-900">
                          {product.name}
                        </td>
                        <td>{product.quantity}</td>
                        <td>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td>{formatCurrency(product.salePrice)}</td>
                        <td>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="text-sm font-medium text-red-600 hover:underline"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredProducts.map((product) => {
                const status = getStatus(product);

                return (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Prix : {formatCurrency(product.salePrice)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                      Stock disponible :{" "}
                      <span className="font-medium text-slate-900">
                        {product.quantity}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <p className="mt-4 text-center text-gray-500">
                Aucun produit trouvé
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}