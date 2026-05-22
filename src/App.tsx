import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
import Sales from "./pages/Sales";
import Clients from "./pages/Clients";
import Suppliers from "./pages/Suppliers";
import FacturePage from "./pages/factures";
import FactureDetailPage from "./pages/FactureDetail";
import ClientsListPage from "./pages/ClientsList";
import SalesHistory from "./pages/SalesHistory";
import StockAlerts from "./pages/StockAlerts";
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            background: "#0f172a",
            color: "#fff",
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients-list" element={<ClientsListPage />} />
          {/* <Route path="/stock" element={<Stock />} /> */}
          <Route path="/sales" element={<Sales />} />
          {/* <Route path="/suppliers" element={<Suppliers />} /> */}
          <Route path="/cash" element={<SalesHistory />} />
          <Route path="/factures" element={<FacturePage />} />
          <Route path="/factures/:id" element={<FactureDetailPage />} />
          <Route path="/stocks/faibles" element={<StockAlerts type="low" />} />
          <Route
            path="/stocks/critiques"
            element={<StockAlerts type="critical" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
