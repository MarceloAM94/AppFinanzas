"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { contarGastosPendientes } from "@/lib/actions/gastos-automaticos";
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Tag,
  Hourglass,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ingresos", label: "Ingresos", icon: ArrowDownLeft },
  { href: "/gastos", label: "Gastos", icon: ArrowUpRight },
  { href: "/gastos-fijos", label: "Gastos Fijos", icon: RefreshCw },
  { href: "/gastos-pendientes", label: "Pendientes", icon: Hourglass },
  { href: "/categorias", label: "Categorías", icon: Tag },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { drawerAbierto, toggleDrawer } = useAppStore();
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    contarGastosPendientes()
      .then(setPendientes)
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={toggleDrawer}
        className={`fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-md bg-surface border border-hairline hover:bg-surface-elevated transition-colors md:hidden ${
          drawerAbierto ? "hidden" : ""
        }`}
        aria-label="Abrir menú"
      >
        <Menu size={18} className="text-body" />
      </button>

      {/* Overlay */}
      {drawerAbierto && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={toggleDrawer} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-full w-60 flex-col bg-surface border-r border-hairline transition-transform duration-300 ${
          drawerAbierto ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-hairline px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-on-primary text-xs font-bold">
              F
            </div>
            <span className="text-sm font-semibold text-body">Mis Finanzas</span>
          </Link>
          <button
            onClick={toggleDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-elevated hover:text-body md:hidden transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => {
            const activo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) toggleDrawer();
                }}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  activo
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted hover:bg-surface-elevated hover:text-body"
                }`}
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/gastos-pendientes" && pendientes > 0 && (
                  <span className="rounded-full bg-down px-2 py-0.5 text-xs font-bold text-white">
                    {pendientes}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-hairline px-4 py-3 text-xs text-muted">
          v2.0 — AppFinanzas
        </div>
      </aside>
    </>
  );
}
