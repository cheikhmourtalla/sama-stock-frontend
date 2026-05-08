import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Menu,
  X,
  ChevronRight,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.jpg";

const links = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Produits", path: "/products", icon: Package },
  { name: "Clients", path: "/clients", icon: Users },
  { name: "Stock", path: "/stock", icon: Boxes },
  { name: "Ventes", path: "/sales", icon: ShoppingCart },
  
];

type SidebarContentProps = {
  onClose?: () => void;
};

function SidebarContent({ onClose }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="SamaStock"
              className="h-12 w-12 rounded-xl object-contain bg-white p-1"
            />

            <div>
              <h1 className="text-2xl font-bold tracking-wide">SamaStock</h1>
              <p className="mt-1 text-sm text-white/60">
                Gestion de stock intelligente
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                <span>{link.name}</span>
              </div>

              <ChevronRight
                size={16}
                className="opacity-40 transition group-hover:translate-x-0.5"
              />
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-sm font-semibold">Version 1.0</p>
          <p className="mt-1 text-xs text-white/60">
            Tableau de bord stock et ventes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl bg-slate-900 p-3 text-white shadow-lg md:hidden"
      >
        <Menu size={20} />
      </button>

      <aside className="hidden min-h-screen w-64 shrink-0 md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-72 shadow-xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}