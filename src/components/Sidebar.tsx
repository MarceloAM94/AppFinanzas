"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icono: "📊" },
  { href: "/ingresos", label: "Ingresos", icono: "💰" },
  { href: "/gastos", label: "Gastos", icono: "💸" },
  { href: "/gastos-fijos", label: "Gastos Fijos", icono: "🔁" },
  { href: "/categorias", label: "Categorías", icono: "🏷️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { drawerAbierto, toggleDrawer } = useAppStore();

  return (
    <>
      {/* Botón hamburguesa - solo visible en mobile cuando el drawer está cerrado */}
      <button
        onClick={toggleDrawer}
        className={`fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md hover:bg-gray-50 md:hidden ${
          drawerAbierto ? "hidden" : ""
        }`}
        aria-label="Abrir menú"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay en mobile */}
      {drawerAbierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleDrawer}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-lg transition-transform duration-300 ${
          drawerAbierto ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <h1 className="text-lg font-bold text-gray-800">Mis Finanzas</h1>
            </div>
            <button
              onClick={toggleDrawer}
              className="rounded-lg p-1 hover:bg-gray-100 md:hidden"
              aria-label="Cerrar menú"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const activo = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) toggleDrawer();
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activo
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{item.icono}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 text-xs text-gray-400">
            v1.0 — AppFinanzas
          </div>
        </div>
      </aside>
    </>
  );
}
