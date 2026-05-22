import { useEffect, useState } from "react";
import type { Facture } from "../services/facture.service";

import FactureTable from "../components/factures/FactureTable";

import { factureService } from "../services/facture.service";
import { useNavigate } from "react-router-dom";
 

export default function FacturePage() {
  const navigate = useNavigate();
  const [totalPages, setTotalPages] = useState(1);
  const [factures, setFactures] = useState<Facture[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const limit = 10;

  async function loadFactures() {
    try {
      setLoading(true);

      const response = await factureService.getFactures(page, limit, search);

      setFactures(response.data);
      console.log(response);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFactures();
  }, [page, search]);

  const handleView = (id: number) => {
    console.log("voir facture", id);

    navigate(`/factures/${id}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Factures</h1>

        <p className="text-gray-500">Gestion des factures clients</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom du client..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-full md:w-96 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <FactureTable factures={factures} onView={handleView} />
      )}

      {/* pagination placeholder */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-500">
          Page {page} sur {totalPages}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Précédent
          </button>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
