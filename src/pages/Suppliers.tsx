import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Phone,
  Truck,
  // CreditCard,
  History,
  ChevronRight,
  Trash2,
  Edit,
  X,
  UserPlus,
  TrendingUp,
  Wallet,
  MapPin,
  Plus,
} from "lucide-react";

import { api } from "../services/api";
import { isAdmin } from "../utils/auth";

// Types alignés sur votre Schema Prisma + Extensions frontend pour les tranches
type Payment = {
  id: number;
  amount: number;
  method: string;
  date: string;
};

type Supply = {
  id: number;
  amount: number;
  paid: number;
  remaining: number;
  date: string;
  payments: Payment[];
};

type Supplier = {
  id: number;
  name: string;
  phone: string;
  address?: string;
  // Ces champs seront calculés ou viendront du backend plus tard
  totalSupplies?: number; 
  totalDebt?: number;
  supplies?: Supply[]; 
};

export default function Suppliers() {
  const admin = isAdmin();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // États Formulaire (Ajout/Modif)
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });

  // États Paiement par tranche
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: "", method: "Espèces" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/suppliers");
      // Votre backend renvoie { success: true, data: [] }
      setSuppliers(res.data.data || []);
    } catch (error) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
    );
  }, [suppliers, search]);

  // --- ACTIONS ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editId) {
        // PATCH pour correspondre à votre supplier.route.ts
        await api.patch(`/suppliers/${editId}`, formData);
        toast.success("Fournisseur mis à jour");
      } else {
        await api.post("/suppliers", formData);
        toast.success("Fournisseur ajouté");
      }
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error("Erreur technique");
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, s: Supplier) => {
    e.stopPropagation();
    setFormData({ name: s.name, phone: s.phone, address: s.address || "" });
    setEditId(s.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer ce fournisseur ?")) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success("Supprimé");
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
      fetchData();
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  const handleAddPayment = () => {
    // Logique frontend uniquement pour l'instant
    toast.success(`Versement de ${paymentData.amount} FCFA enregistré (Simulé)`);
    setShowPaymentModal(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* HEADER STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fournisseurs</h1>
          <p className="text-slate-500 mt-1">Gestion des approvisionnements et règlements.</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="bg-blue-500 p-3 rounded-xl text-white"><Truck size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Achats</p>
            <p className="text-lg font-black text-slate-900">0 FCFA</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="bg-rose-500 p-3 rounded-xl text-white"><Wallet size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Dette Restante</p>
            <p className="text-lg font-black text-rose-600">0 FCFA</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-4 outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <button onClick={() => { setIsEditing(false); setFormData({name:"", phone:"", address:""}); setShowForm(true); }}
          className="bg-slate-900 text-white rounded-2xl px-8 py-4 font-bold flex items-center gap-2 hover:bg-slate-800 transition-all w-full lg:w-auto justify-center"
        >
          <UserPlus size={18} /> Ajouter Fournisseur
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LISTE GAUCHE */}
        <div className="xl:col-span-5 space-y-4">
          {loading ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 text-slate-400">Chargement...</div>
          ) : (
            filteredSuppliers.map((s) => (
              <div key={s.id} onClick={() => setSelectedSupplier(s)}
                className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedSupplier?.id === s.id ? "border-slate-900 ring-1 ring-slate-900 shadow-md" : "border-transparent shadow-sm hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 uppercase">{s.name.substring(0, 2)}</div>
                  <div>
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Phone size={12} /> {s.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => handleOpenEdit(e, s)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                  {admin && <button onClick={(e) => handleDelete(e, s.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>}
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* DETAILS DROITE */}
        <div className="xl:col-span-7">
          {selectedSupplier ? (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 sticky top-8 space-y-8">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-slate-900 rounded-2xl text-white"><Truck size={32} /></div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-slate-900">{selectedSupplier.name}</h2>
                  <p className="text-slate-500 mt-1 flex items-center justify-end gap-2"><MapPin size={16} /> {selectedSupplier.address || "Dakar, Sénégal"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center lg:text-left">Cumul Achats</p>
                  <p className="text-2xl font-black text-slate-900 mt-2 text-center lg:text-left">0 FCFA</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest text-center lg:text-left">Reste à payer</p>
                  <p className="text-2xl font-black text-rose-600 mt-2 text-center lg:text-left">0 FCFA</p>
                </div>
              </div>

              {/* LISTE DES FACTURES / APPROS */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 flex items-center gap-2 px-1"><History size={18} className="text-slate-400" /> Historique des Paiements par tranche</h4>
                
                <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center text-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-4 text-slate-300"><Plus size={32} /></div>
                  <p className="text-slate-500 font-bold">Aucun approvisionnement enregistré</p>
                  <p className="text-sm text-slate-400 mt-1">Les factures et versements apparaîtront ici après vos achats.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 bg-white">
              <TrendingUp size={60} className="mb-4 opacity-10" />
              <p className="font-black text-slate-500">Sélectionnez un fournisseur pour gérer les paiements</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORMULAIRE (AJOUT / MODIF) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-black text-slate-900 mb-8">{isEditing ? "Modifier" : "Nouveau"} Fournisseur</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nom du fournisseur / Entreprise</label>
                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-slate-900 font-medium" placeholder="Ex: Sama Distribution" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Téléphone</label>
                <input required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-slate-900 font-medium" placeholder="77..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Adresse (Optionnel)</label>
                <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-slate-900 font-medium" placeholder="Ex: Dakar, Rue 10" />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-slate-200 transition-all mt-4">
                {isEditing ? "Enregistrer les modifications" : "Créer le compte"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VERSEMENT (TRANCHE) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X size={24} /></button>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Effectuer un versement</h2>
            <p className="text-slate-500 mb-8 font-medium">Réduction de la dette fournisseur</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Montant à verser (FCFA)</label>
                <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-slate-900 font-black text-2xl text-emerald-600" placeholder="0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Méthode de paiement</label>
                <select value={paymentData.method} onChange={(e) => setPaymentData({...paymentData, method: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-slate-900 font-bold appearance-none">
                  <option>Espèces</option>
                  <option>Wave</option>
                  <option>Orange Money</option>
                </select>
              </div>
              <button onClick={handleAddPayment} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}