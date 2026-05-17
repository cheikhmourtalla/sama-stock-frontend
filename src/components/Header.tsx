import { useLocation } from "react-router-dom";

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
 // "/sales": {
  //  title: "Ventes",
   // description: "Suivez les ventes et les montants générés.",
 // },
  "/supplies": {
  title: "Approvisionnements",
  description: "Enregistrez vos achats fournisseurs et suivez les acomptes.",
},
};

export default function Header() {
  const location = useLocation();

  const currentPage = pageConfig[location.pathname] || {
    title: "SamaStock",
    description: "Gestion de stock intelligente.",
  };

  return (
    <header className="rounded-3xl bg-white px-6 py-5 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {currentPage.title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {currentPage.description}
        </p>
      </div>
    </header>
  );
}