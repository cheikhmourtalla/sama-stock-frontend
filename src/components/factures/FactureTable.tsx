import { Eye } from "lucide-react";
import FactureStatusBadge from "./FactureStatusBadge";
import type { Facture } from "../../services/facture.service";

type Props = {
  factures: Facture[];
  onView: (id: number) => void;
};

export default function FactureTable({ factures, onView }: Props) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr className="text-left text-sm text-gray-600">
            <th className="p-4">Facture</th>
            <th className="p-4">Client</th>
            <th className="p-4">Montant</th>
            <th className="p-4">Restant</th>
            <th className="p-4">Statut</th>
            <th className="p-4">Date</th>
            <th className="p-4"></th>
          </tr>
        </thead>

        <tbody>
          {factures.map((facture) => (
            <tr
              key={facture.id}
              className="border-b hover:bg-gray-50 transition"
            >
              {/* NUMERO FACTURE */}
              <td className="p-4 font-semibold">#{facture.numero}</td>

              {/* CLIENT */}
              <td className="p-4">{facture.clientNom}</td>

              {/* TOTAL */}
              <td className="p-4">{facture.total.toLocaleString()} F</td>

              {/* RESTE */}
              <td className="p-4">{facture.resteDu.toLocaleString()} F</td>

              {/* STATUT */}
              <td className="p-4">
                <FactureStatusBadge statut={facture.statut} />
              </td>

              {/* DATE */}
              <td className="p-4">
                {new Date(facture.dateFacture).toLocaleDateString()}
              </td>

              {/* ACTION */}
              <td className="p-4">
                <button
                  onClick={() => onView(facture.id)}
                  className="p-2 rounded hover:bg-gray-100 transition"
                >
                  <Eye size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
