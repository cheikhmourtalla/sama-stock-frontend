import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Phone,
  MapPin,
  Wallet,
  Truck,
  Edit,
  Trash2,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";

type Supplier = {
  id: number;
  name: string;
  phone: string;
  address?: string;
  totalSupplies?: number;
  totalPaid?: number;
  totalDebt?: number;
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const fetchSuppliers = async () => {
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement des fournisseurs");
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        supplier.phone.includes(search)
    );
  }, [suppliers, search]);

  const stats = useMemo(() => ({
    total: suppliers.reduce((acc, s) => acc + (s.totalSupplies || 0), 0),
    paid: suppliers.reduce((acc, s) => acc + (s.totalPaid || 0), 0),
    debt: suppliers.reduce((acc, s) => acc + (s.totalDebt || 0), 0),
  }), [suppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/suppliers", formData);
      setFormData({ name: "", phone: "", address: "" });
      setIsOpen(false);
      fetchSuppliers();
      toast.success("Fournisseur ajouté");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const deleteSupplier = async (id: number) => {
    if (!window.confirm("Supprimer ce fournisseur ?")) return;
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
      toast.success("Fournisseur supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-4 lg:p-8 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fournisseurs</h1>
          <p className="text-slate-500 mt-1">Gérez vos relations et le suivi des approvisionnements.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Plus size={20} /> Nouveau fournisseur
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Approvisionnements</p>
            <h2 className="text-2xl font-black text-slate-900 mt-2">{stats.total.toLocaleString()} FCFA</h2>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><Truck size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Payé</p>
            <h2 className="text-2xl font-black text-green-600 mt-2">{stats.paid.toLocaleString()} FCFA</h2>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl text-green-600"><Wallet size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Dette Fournisseur</p>
            <h2 className="text-2xl font-black text-red-600 mt-2">{stats.debt.toLocaleString()} FCFA</h2>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl text-red-600"><Wallet size={24} /></div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-white">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/50">
              <tr className="text-left text-slate-400 text-xs uppercase tracking-widest">
                <th className="p-6 font-semibold">Fournisseur</th>
                <th className="p-6 font-semibold">Téléphone</th>
                <th className="p-6 font-semibold text-right">Achats</th>
                <th className="p-6 font-semibold text-right">Reste</th>
                <th className="p-6 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div>
                      <p className="font-bold text-slate-900">{supplier.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {supplier.address || "Aucune adresse"}
                      </p>
                    </div>
                  </td>
                  <td className="p-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Phone size={14} /> {supplier.phone}</div>
                  </td>
                  <td className="p-6 text-right font-bold text-slate-700">
                    {Number(supplier.totalSupplies || 0).toLocaleString()} FCFA
                  </td>
                  <td className="p-6 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(supplier.totalDebt || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {Number(supplier.totalDebt || 0).toLocaleString()} FCFA
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                      <button onClick={() => deleteSupplier(supplier.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL (Style mis à jour) */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Nouveau fournisseur</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nom complet</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Téléphone</label>
                <input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Adresse</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-slate-900 h-24"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white px-5 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}