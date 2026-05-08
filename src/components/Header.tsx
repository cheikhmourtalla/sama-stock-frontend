import { useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { getStoredUser } from "../utils/auth";

const pageConfig: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Tableau de bord",
    description: "Vue d’ensemble de votre activité SamaStock.",
  },
  "/products": {
    title: "Produits",
    description: "Gérez vos produits, vos références et vos alertes.",
  },
  "/clients": {
  title: "Clients",
  description: "Gérez vos clients et suivez leurs comptes.",
},
  "/stock": {
    title: "Stock",
    description: "Enregistrez les entrées, sorties et mouvements.",
  },
  "/sales": {
    title: "Ventes",
    description: "Suivez les ventes et les montants générés.",
  },
  "/supplies": {
  title: "Approvisionnements",
  description: "Enregistrez vos achats fournisseurs et suivez les acomptes.",
},
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();

  const currentPage = pageConfig[location.pathname] || {
    title: "SamaStock",
    description: "Gestion de stock intelligente.",
  };

  const currentDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="rounded-3xl bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {currentPage.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {currentPage.description}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-slate-900">
              {user?.name || "Utilisateur"}
            </p>
            <p className="text-xs text-gray-400">
              {user?.role === "admin" ? "Administrateur" : "Employé"}
            </p>
            <p className="text-xs capitalize text-gray-400">{currentDate}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}