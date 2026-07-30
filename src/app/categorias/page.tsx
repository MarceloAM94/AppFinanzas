"use client";

import { useEffect, useState } from "react";
import { obtenerCategorias, agregarCategoria, desactivarCategoria } from "@/lib/actions/categorias";
import type { Categoria } from "@/types";

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", icono_color: "" });

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerCategorias();
      setCategorias(data as Categoria[]);
    } catch {
      setError("Error al cargar categorías");
    }
    setCargando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    await agregarCategoria(form.nombre, form.icono_color || undefined);
    setForm({ nombre: "", icono_color: "" });
    setShowForm(false);
    setGuardando(false);
    await cargar();
  }

  async function handleDesactivar(id: string) {
    if (!confirm("¿Desactivar esta categoría?")) return;
    await desactivarCategoria(id);
    await cargar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          + Nueva
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-slide-in rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Nueva Categoría</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
              <input type="text" required value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Icono (emoji)</label>
              <input type="text" value={form.icono_color} placeholder="🍎"
                onChange={(e) => setForm({ ...form, icono_color: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={guardando} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">
              {guardando ? "Guardando..." : "Agregar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {cargando ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : categorias.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-400">No hay categorías</p>
            <p className="mt-1 text-xs text-gray-300">Presiona <strong>+ Nueva</strong> para agregar una</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-2xl">{cat.icono_color || "📁"}</span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900">{cat.nombre}</div>
                    <div className="text-sm text-gray-500">
                      {cat.activo ? "🟢 Activa" : "🔴 Inactiva"}
                    </div>
                  </div>
                </div>
                {cat.activo && (
                  <button
                    onClick={() => handleDesactivar(cat.id)}
                    className="min-h-[44px] shrink-0 rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
