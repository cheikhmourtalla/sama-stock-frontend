import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Sale } from "../types/sale";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type Props = {
  sales: Sale[];
};

export default function SalesChart({ sales }: Props) {
  const salesByDate: Record<string, number> = {};

  sales.forEach((sale) => {
    const date = new Date(sale.createdAt).toLocaleDateString("fr-FR");
    salesByDate[date] = (salesByDate[date] || 0) + sale.totalAmount;
  });

  const labels = Object.keys(salesByDate);
  const values = Object.values(salesByDate);

  const data = {
    labels,
    datasets: [
      {
        label: "Ventes par jour (FCFA)",
        data: values,
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  return <Line data={data} options={options} />;
}