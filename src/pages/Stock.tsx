import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProducts } from "../services/product.service";
import {
  addStockEntry,
  addStockOut,
  getStockMovements,
  type StockPayload,
} from "../services/stock.service";
import type { Product } from "../types/product";
import type { StockMovement } from "../types/stock";

const initialForm: StockPayload = {
  productId: 0,
  quantity: 0,
  note: "",
};

export default function Stock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [submittingOut, setSubmittingOut] = useState(false);
  const [entryForm, setEntryForm] = useState<StockPayload>(initialForm);
  const [outForm, setOutForm] = useState<StockPayload>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAllMovements, setShowAllMovements] = useState(false);

  const visibleMovements = showAllMovements
    ? movements
    : movements.slice(0, 5);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [productsResponse, movementsData] = await Promise.all([
        getProducts(),
        getStockMovements(),
      ]);

      setProducts(productsResponse.data);
      setMovements(movementsData);
    } catch (error) {
      console.error("Erreur stock", error);
      toast.error("Erreur lors du chargement du stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEntryChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setEntryForm((prev) => ({
      ...prev,
      [name]:
        name === "productId" || name === "quantity" ? Number(value) : value,
    }));
  };

  const handleOutChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setOutForm((prev) => ({
      ...prev,
      [name]:
        name === "productId" || name === "quantity" ? Number(value) : value,
    }));
  };

  const resetEntryForm = () => {
    setEntryForm(initialForm);
  };

  const resetOutForm = () => {
    setOutForm(initialForm);
  };

  const handleEntrySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmittingEntry(true);

    try {
      await addStockEntry(entryForm);
      toast.success("Entrée de stock enregistrée");
      resetEntryForm();
      await fetchData();
    } catch (error: any) {
      console.error("Erreur entrée stock", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Impossible d'enregistrer l'entrée de stock."
      );
      toast.error("Erreur lors de l'entrée de stock");
    } finally {
      setSubmittingEntry(false);
    }
  };

  const handleOutSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmittingOut(true);

    try {
      await addStockOut(outForm);
      toast.success("Sortie de stock enregistrée");
      resetOutForm();
      await fetchData();
    } catch (error: any) {
      console.error("Erreur sortie stock", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Impossible d'enregistrer la sortie de stock."
      );
      toast.error("Erreur lors de la sortie de stock");
    } finally {
      setSubmittingOut(false);
    }
  };

  return (
    <section className="space-y-6">
     

      {errorMessage && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-slate-900">
            Entrée de stock
          </h3>

          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Produit
              </label>
              <select
                name="productId"
                value={entryForm.productId}
                onChange={handleEntryChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                required
              >
                <option value={0}>Sélectionner un produit</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.quantity} en stock)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Quantité ajoutée
              </label>
              <input
                type="number"
                name="quantity"
                value={entryForm.quantity}
                onChange={handleEntryChange}
                min={1}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Note
              </label>
              <textarea
                name="note"
                value={entryForm.note}
                onChange={handleEntryChange}
                className="min-h-[100px] w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="Ex: Réapprovisionnement fournisseur"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submittingEntry}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {submittingEntry ? "Enregistrement..." : "Ajouter au stock"}
              </button>

              <button
                type="button"
                onClick={resetEntryForm}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-slate-900">
            Sortie de stock
          </h3>

          <form onSubmit={handleOutSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Produit
              </label>
              <select
                name="productId"
                value={outForm.productId}
                onChange={handleOutChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                required
              >
                <option value={0}>Sélectionner un produit</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.quantity} en stock)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Quantité retirée
              </label>
              <input
                type="number"
                name="quantity"
                value={outForm.quantity}
                onChange={handleOutChange}
                min={1}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Note
              </label>
              <textarea
                name="note"
                value={outForm.note}
                onChange={handleOutChange}
                className="min-h-[100px] w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="Ex: Produit retiré, casse, perte..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submittingOut}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {submittingOut ? "Enregistrement..." : "Sortir du stock"}
              </button>

              <button
                type="button"
                onClick={resetOutForm}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
  <h3 className="mb-4 text-xl font-bold text-slate-900">
    Historique des mouvements
  </h3>

  {loading ? (
    <p>Chargement...</p>
  ) : (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-sm text-gray-500">
              <th className="pb-3">Produit</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Quantité</th>
              <th className="pb-3">Note</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {visibleMovements.map((movement) => (
              <tr key={movement.id} className="border-b hover:bg-gray-50">
                <td className="py-4 font-medium text-slate-900">
                  {movement.product?.name}
                </td>
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      movement.type === "ENTRY"
                        ? "bg-green-100 text-green-700"
                        : movement.type === "OUT"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {movement.type}
                  </span>
                </td>
                <td>{movement.quantity}</td>
                <td>{movement.note || "-"}</td>
                <td>{new Date(movement.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-4 lg:hidden">
        {visibleMovements.map((movement) => (
          <div
            key={movement.id}
            className="rounded-2xl border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {movement.product?.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {new Date(movement.createdAt).toLocaleString()}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  movement.type === "ENTRY"
                    ? "bg-green-100 text-green-700"
                    : movement.type === "OUT"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {movement.type}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Quantité</p>
                <p className="font-medium text-slate-900">{movement.quantity}</p>
              </div>

              <div className="col-span-2">
                <p className="text-gray-400">Note</p>
                <p className="font-medium text-slate-900">
                  {movement.note || "-"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {movements.length > 5 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAllMovements((prev) => !prev)}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {showAllMovements ? "Voir moins" : "Voir plus"}
          </button>
        </div>
      )}

      {movements.length === 0 && (
        <p className="mt-4 text-center text-gray-500">
          Aucun mouvement enregistré
        </p>
      )}
    </>
  )}
</div>
    </section>
  );
}