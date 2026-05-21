import { useEffect, useState } from "react";
import type { Facture } from "../services/facture.service";

import FactureTable from "../components/factures/FactureTable";

import { factureService } from "../services/facture.service";
import { useNavigate } from "react-router-dom";

export default function FacturePage() {
  const navigate = useNavigate();
  const [factures, setFactures] = useState<Facture[]>([]);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const limit = 10;

  async function loadFactures() {
    try {
      setLoading(true);

      const response = await factureService.getFactures(page, limit);

      setFactures(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFactures();
  }, [page]);

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

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <FactureTable factures={factures} onView={handleView} />
      )}

      {/* pagination placeholder */}
      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-2 border rounded"
        >
          Précédent
        </button>

        <span>Page {page}</span>

        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-2 border rounded"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
