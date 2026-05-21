type Props = {
  statut: string;
};

export default function FactureStatusBadge({
  statut,
}: Props) {
  if (statut === "REGLEE") {
    return (
      <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
        Payée
      </span>
    );
  }

  if (statut === "PARTIELLEMENT_REGLEE") {
    return (
      <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold">
        Partielle
      </span>
    );
  }

  return (
    <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">
      Non réglée
    </span>
  );
}